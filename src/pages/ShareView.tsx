import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { supabase } from '@/lib/supabase'
import { MessageList } from '@/components/chat/MessageList'
import type { Card, Citation, Message } from '@/types/agent'

interface State {
  status: 'loading' | 'missing' | 'ready' | 'error'
  messages: Message[]
  title: string | null
  errorMessage?: string
}

export default function ShareView() {
  const { slug } = useParams<{ slug: string }>()
  const [state, setState] = useState<State>({
    status: 'loading',
    messages: [],
    title: null,
  })

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!slug) {
        setState({ status: 'missing', messages: [], title: null })
        return
      }
      const { data: convo, error: convoErr } = await supabase
        .from('conversations')
        .select('id, title, shared')
        .eq('share_slug', slug)
        .maybeSingle()

      if (cancelled) return
      if (convoErr) {
        setState({
          status: 'error',
          messages: [],
          title: null,
          errorMessage: convoErr.message,
        })
        return
      }
      if (!convo || !convo.shared) {
        setState({ status: 'missing', messages: [], title: null })
        return
      }

      const { data: msgRows, error: msgErr } = await supabase
        .from('messages')
        .select('id, role, content, citations, cards, created_at')
        .eq('conversation_id', convo.id)
        .order('created_at', { ascending: true })

      if (cancelled) return
      if (msgErr) {
        setState({
          status: 'error',
          messages: [],
          title: convo.title,
          errorMessage: msgErr.message,
        })
        return
      }

      const messages: Message[] = (msgRows ?? []).map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        citations: Array.isArray(m.citations) ? (m.citations as unknown as Citation[]) : [],
        cards: Array.isArray(m.cards) ? (m.cards as unknown as Card[]) : [],
        created_at: m.created_at,
      }))

      setState({ status: 'ready', messages, title: convo.title })
    }
    load()
    return () => {
      cancelled = true
    }
  }, [slug])

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-tight">TR-ACE · Shared conversation</span>
          {state.title && (
            <span className="text-xs text-muted-foreground truncate max-w-xs">{state.title}</span>
          )}
        </div>
        <Link
          to="/"
          className="text-xs font-medium text-primary hover:underline"
        >
          Start your own →
        </Link>
      </header>

      <main className="flex-1 flex flex-col max-w-3xl mx-auto w-full">
        {state.status === 'loading' && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Loading shared conversation…</p>
          </div>
        )}

        {state.status === 'missing' && (
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="text-center space-y-2">
              <h1 className="text-xl font-semibold">This share link is no longer active</h1>
              <p className="text-sm text-muted-foreground">
                The owner may have turned off sharing. Ask them for a fresh link.
              </p>
            </div>
          </div>
        )}

        {state.status === 'error' && (
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="text-center space-y-2">
              <h1 className="text-xl font-semibold">Couldn't load this conversation</h1>
              <p className="text-sm text-muted-foreground">
                {state.errorMessage ?? 'Please try again in a moment.'}
              </p>
            </div>
          </div>
        )}

        {state.status === 'ready' && (
          <MessageList messages={state.messages} streamingId={null} readOnly />
        )}
      </main>
    </div>
  )
}
