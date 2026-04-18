// TR-ACE agent-run edge function.
//
// Flow per request:
//   1. Verify user JWT (supabase auth) and extract user_id.
//   2. Create-or-reuse a conversation row (service-role write).
//   3. Insert the incoming user message (service-role write).
//   4. Stream SSE back to the client.
//   5. Ask Gemini for a response, offering web_search + places_search
//      as function-call tools. At most one tool call this phase.
//   6. If a function call is returned, execute the tool, persist a
//      tool_calls row, emit tool_call_start / tool_call_end, then ask
//      Gemini to synthesize the final answer (streaming).
//   7. Stream tokens to the client, accumulate the final text, extract
//      citations from tool output, insert the assistant message row,
//      emit `done`, close the stream.

// @ts-expect-error Deno remote module, resolved at runtime.
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

import { corsHeaders, handlePreflight } from './cors.ts'
import { createSSEStream, SSE_HEADERS, type SSEEvent } from './sse.ts'
import {
  callGemini,
  extractFunctionCall,
  extractText,
  streamGemini,
  type GeminiContent,
  type GeminiRequest,
} from './gemini.ts'
import { runWebSearch, WEB_SEARCH_DECLARATION, type WebSearchOutput } from './tools/webSearch.ts'
import {
  runPlacesSearch,
  PLACES_SEARCH_DECLARATION,
  type PlacesSearchOutput,
} from './tools/placesSearch.ts'

// @ts-expect-error Deno global is present at runtime.
declare const Deno: { env: { get(key: string): string | undefined }; serve(handler: (req: Request) => Promise<Response> | Response): void }

const SYSTEM_INSTRUCTION = `You are TR-ACE, an agentic search assistant that helps users find things online — products, places, facts, articles.

Rules:
- If the user asks about real-world places (restaurants, venues, shops, landmarks, services), call places_search.
- For anything else that requires current information (news, facts, tutorials, comparisons), call web_search.
- Call at most ONE tool per turn. Use the tool's output to ground your answer.
- Cite every factual claim with [1], [2]... that map to the tool's result URLs/links. Never invent URLs, prices, phone numbers, addresses, or ratings.
- If the tool returns nothing useful, say so plainly instead of guessing.
- Be concise. Prefer short paragraphs and short lists.
- Markdown is allowed.`

interface RequestBody {
  message: string
  conversation_id: string | null
}

interface Citation {
  url: string
  title: string
  snippet?: string
}

function json(status: number, body: unknown, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  })
}

async function parseBody(req: Request): Promise<RequestBody | null> {
  try {
    const body = await req.json()
    if (typeof body?.message !== 'string' || body.message.trim().length === 0) return null
    const conversationId =
      typeof body.conversation_id === 'string' && body.conversation_id.length > 0 ? body.conversation_id : null
    return { message: body.message, conversation_id: conversationId }
  } catch {
    return null
  }
}

function citationsFromWebSearch(out: WebSearchOutput): Citation[] {
  return out.items
    .filter((it) => !!it.link)
    .map((it) => ({ url: it.link, title: it.title || it.displayLink, snippet: it.snippet || undefined }))
}

function citationsFromPlaces(out: PlacesSearchOutput): Citation[] {
  return out.places
    .filter((p) => !!p.maps_url)
    .map((p) => ({
      url: p.maps_url,
      title: p.name,
      snippet: p.address || undefined,
    }))
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin')

  const pre = handlePreflight(req)
  if (pre) return pre

  if (req.method !== 'POST') {
    return json(405, { error: 'method not allowed' }, origin)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return json(500, { error: 'server misconfigured: supabase env missing' }, origin)
  }

  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    return json(401, { error: 'missing bearer token' }, origin)
  }
  const accessToken = authHeader.slice(7).trim()

  const userClient: SupabaseClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const adminClient: SupabaseClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: authData, error: authError } = await userClient.auth.getUser(accessToken)
  if (authError || !authData?.user) {
    return json(401, { error: 'invalid token' }, origin)
  }
  const userId = authData.user.id

  const body = await parseBody(req)
  if (!body) return json(400, { error: 'invalid body' }, origin)

  // Ensure a conversation row. The user-scoped client enforces RLS on
  // INSERT; service role handles any downstream writes that must
  // bypass RLS (tool_calls).
  let conversationId = body.conversation_id
  if (!conversationId) {
    const title = body.message.slice(0, 60)
    const { data: convo, error: convoErr } = await userClient
      .from('conversations')
      .insert({ user_id: userId, title })
      .select('id')
      .single()
    if (convoErr || !convo) {
      return json(500, { error: `failed to create conversation: ${convoErr?.message ?? 'unknown'}` }, origin)
    }
    conversationId = convo.id as string
  } else {
    // Touch updated_at so the conversation list reorders.
    await userClient.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId)
  }

  // Insert the user message.
  const { error: userMsgErr } = await userClient.from('messages').insert({
    conversation_id: conversationId,
    role: 'user',
    content: body.message,
  })
  if (userMsgErr) {
    return json(500, { error: `failed to persist user message: ${userMsgErr.message}` }, origin)
  }

  // Load prior turns (up to 10) for context.
  const { data: priorRows } = await userClient
    .from('messages')
    .select('role, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(20)

  const history: GeminiContent[] = (priorRows ?? [])
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .slice(-10)
    .map((m) => ({
      role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
      parts: [{ text: m.content }],
    }))
  // The just-inserted user message should be the last entry already.

  const sse = createSSEStream()
  const resp = new Response(sse.stream, {
    status: 200,
    headers: { ...corsHeaders(origin), ...SSE_HEADERS },
  })

  const runAgent = async () => {
    const emit = (e: SSEEvent) => sse.emit(e)
    try {
      emit({ type: 'conversation_id', id: conversationId! })

      const baseRequest: GeminiRequest = {
        systemInstruction: { role: 'system', parts: [{ text: SYSTEM_INSTRUCTION }] },
        tools: [
          {
            functionDeclarations: [WEB_SEARCH_DECLARATION, PLACES_SEARCH_DECLARATION],
          },
        ],
        contents: history,
      }

      const first = await callGemini(baseRequest)
      const fcall = extractFunctionCall(first)

      let citations: Citation[] = []
      let toolCallDbId: string | null = null
      let finalContents: GeminiContent[] = history
      void toolCallDbId

      if (fcall) {
        emit({ type: 'tool_call_start', tool: fcall.name, input: fcall.args })
        const started = Date.now()
        let toolOutput: unknown = {}
        let status: 'success' | 'error' | 'timeout' = 'success'
        let errorMessage: string | null = null
        try {
          if (fcall.name === 'web_search') {
            const out = await runWebSearch({
              query: String(fcall.args.query ?? ''),
              num_results:
                typeof fcall.args.num_results === 'number' ? (fcall.args.num_results as number) : undefined,
            })
            toolOutput = out
            citations = citationsFromWebSearch(out)
          } else if (fcall.name === 'places_search') {
            const out = await runPlacesSearch({
              query: String(fcall.args.query ?? ''),
              location: typeof fcall.args.location === 'string' ? (fcall.args.location as string) : undefined,
              radius_m:
                typeof fcall.args.radius_m === 'number' ? (fcall.args.radius_m as number) : undefined,
            })
            toolOutput = out
            citations = citationsFromPlaces(out)
          } else {
            status = 'error'
            errorMessage = `unknown tool: ${fcall.name}`
            toolOutput = { error: errorMessage }
          }
        } catch (err) {
          status = 'error'
          errorMessage = err instanceof Error ? err.message : String(err)
          toolOutput = { error: errorMessage }
        }
        const duration = Date.now() - started
        emit({ type: 'tool_call_end', tool: fcall.name, output: toolOutput, duration_ms: duration })

        // Extend the conversation contents with model's function call
        // + our function response so Gemini can synthesize.
        finalContents = [
          ...history,
          { role: 'model', parts: [{ functionCall: fcall }] },
          {
            role: 'function',
            parts: [
              {
                functionResponse: {
                  name: fcall.name,
                  response: toolOutput as Record<string, unknown>,
                },
              },
            ],
          },
        ]

        // We still need a message row to attach tool_calls to, but we
        // don't have one until the assistant response completes. We
        // insert a placeholder assistant row now, then update its
        // content at the end — this lets us FK tool_calls.message_id.
        const { data: placeholder, error: placeholderErr } = await adminClient
          .from('messages')
          .insert({
            conversation_id: conversationId,
            role: 'assistant',
            content: '',
            citations: [],
          })
          .select('id')
          .single()
        if (placeholderErr || !placeholder) {
          throw new Error(`failed to create assistant placeholder: ${placeholderErr?.message ?? 'unknown'}`)
        }
        const placeholderId = placeholder.id as string

        const { error: tcErr } = await adminClient.from('tool_calls').insert({
          message_id: placeholderId,
          tool_name: fcall.name,
          input: fcall.args as Record<string, unknown>,
          output: toolOutput as Record<string, unknown>,
          duration_ms: duration,
          cost_usd: 0,
          status,
          error_message: errorMessage,
        })
        if (tcErr) {
          console.error('failed to log tool_call:', tcErr.message)
        }
        toolCallDbId = placeholderId

        // Stream the synthesis pass.
        let assembled = ''
        const synthRequest: GeminiRequest = { ...baseRequest, contents: finalContents }
        for await (const chunk of streamGemini(synthRequest)) {
          assembled += chunk
          emit({ type: 'token', text: chunk })
        }

        // Update the placeholder message row with the real content +
        // citations. Service role because messages_update has no user
        // policy.
        const { error: updErr } = await adminClient
          .from('messages')
          .update({ content: assembled, citations: citations as unknown as Record<string, unknown>[] })
          .eq('id', placeholderId)
        if (updErr) console.error('failed to finalize assistant message:', updErr.message)
      } else {
        // No tool call — stream a plain synthesis and persist once done.
        // We already have the non-streaming first response; stream a
        // second pass for token delivery to the client.
        const plainText = extractText(first)
        if (plainText.length > 0) {
          // Chunk it manually so the UI still streams.
          for (const piece of plainText.match(/.{1,80}/gs) ?? [plainText]) {
            emit({ type: 'token', text: piece })
          }
        } else {
          // Fall back to streamGenerateContent if the first call returned no text.
          for await (const chunk of streamGemini(baseRequest)) {
            emit({ type: 'token', text: chunk })
          }
        }

        const { error: insErr } = await userClient.from('messages').insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: plainText,
          citations: [],
        })
        if (insErr) console.error('failed to persist assistant message:', insErr.message)
      }

      emit({ type: 'done' })
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err)
      console.error('agent-run error:', detail)
      emit({ type: 'error', message: 'agent failed — see server logs' })
    } finally {
      sse.close()
    }
  }

  // Fire-and-forget the agent loop; the stream is already wired into
  // the Response body.
  runAgent()

  return resp
})
