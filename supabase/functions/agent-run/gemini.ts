// Gemini REST client for agent-run.
//
// Uses v1beta generateContent + streamGenerateContent against
// gemini-2.0-flash. We stay on REST (not the JS SDK) because the
// function-calling surface is identical and we avoid a bundled
// dependency in the Deno runtime.
//
// Ref:
//   https://ai.google.dev/gemini-api/docs/function-calling
//   https://ai.google.dev/api/generate-content

export interface GeminiFunctionDeclaration {
  name: string
  description: string
  parameters: Record<string, unknown>
}

export interface GeminiTextPart {
  text: string
}

export interface GeminiFunctionCallPart {
  functionCall: {
    name: string
    args: Record<string, unknown>
  }
}

export interface GeminiFunctionResponsePart {
  functionResponse: {
    name: string
    response: Record<string, unknown>
  }
}

export type GeminiPart = GeminiTextPart | GeminiFunctionCallPart | GeminiFunctionResponsePart

export interface GeminiContent {
  role: 'user' | 'model' | 'function'
  parts: GeminiPart[]
}

export interface GeminiRequest {
  contents: GeminiContent[]
  systemInstruction?: { role: 'system'; parts: GeminiTextPart[] }
  tools?: Array<{ functionDeclarations: GeminiFunctionDeclaration[] }>
}

interface GeminiCandidate {
  content?: { parts?: GeminiPart[] }
  finishReason?: string
}

interface GeminiResponsePayload {
  candidates?: GeminiCandidate[]
  error?: { message?: string; status?: string }
  promptFeedback?: unknown
}

const MODEL = 'gemini-2.0-flash'
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

function apiKey(): string {
  const key = Deno.env.get('GEMINI_API_KEY')
  if (!key) throw new Error('GEMINI_API_KEY is not set')
  return key
}

export async function callGemini(request: GeminiRequest): Promise<GeminiResponsePayload> {
  const url = `${BASE}/${MODEL}:generateContent?key=${encodeURIComponent(apiKey())}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  const json = (await res.json()) as GeminiResponsePayload
  if (!res.ok) {
    throw new Error(`Gemini generateContent failed: ${res.status} ${json.error?.message ?? res.statusText}`)
  }
  return json
}

// streamGemini returns an async iterable of text chunks as they
// arrive on the SSE response. We ignore non-text parts for the final
// synthesis pass — the caller has already handled function calls.
export async function* streamGemini(request: GeminiRequest): AsyncGenerator<string, void, unknown> {
  const url = `${BASE}/${MODEL}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey())}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => '')
    throw new Error(`Gemini streamGenerateContent failed: ${res.status} ${text}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    // SSE frames separated by blank line. Each data frame is JSON.
    let idx: number
    while ((idx = buffer.indexOf('\n\n')) !== -1) {
      const frame = buffer.slice(0, idx)
      buffer = buffer.slice(idx + 2)
      for (const line of frame.split('\n')) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (!data || data === '[DONE]') continue
        try {
          const payload = JSON.parse(data) as GeminiResponsePayload
          const parts = payload.candidates?.[0]?.content?.parts ?? []
          for (const part of parts) {
            if ('text' in part && typeof part.text === 'string') {
              yield part.text
            }
          }
        } catch {
          // Ignore malformed frames; the stream recovers on the next one.
        }
      }
    }
  }
}

export function extractFunctionCall(resp: GeminiResponsePayload): GeminiFunctionCallPart['functionCall'] | null {
  const parts = resp.candidates?.[0]?.content?.parts ?? []
  for (const part of parts) {
    if ('functionCall' in part) return part.functionCall
  }
  return null
}

export function extractText(resp: GeminiResponsePayload): string {
  const parts = resp.candidates?.[0]?.content?.parts ?? []
  let out = ''
  for (const part of parts) {
    if ('text' in part) out += part.text
  }
  return out
}
