export interface Citation {
  url: string
  title: string
  snippet?: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  citations: Citation[]
  created_at: string
}

export type AgentSSEEvent =
  | { type: 'conversation_id'; id: string }
  | { type: 'token'; text: string }
  | { type: 'tool_call_start'; tool: string; input: unknown }
  | { type: 'tool_call_end'; tool: string; output: unknown; duration_ms: number }
  | { type: 'done' }
  | { type: 'error'; message: string }
