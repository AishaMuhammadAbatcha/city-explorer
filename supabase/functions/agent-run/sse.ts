// Tiny SSE writer used by agent-run.
//
// createSSEStream() returns a ReadableStream plus an `emit(event)`
// function that JSON-encodes each event as a single `data:` frame.
// The caller wires the stream directly into the Response body.

export type SSEEvent =
  | { type: 'conversation_id'; id: string }
  | { type: 'token'; text: string }
  | { type: 'tool_call_start'; tool: string; input: unknown }
  | { type: 'tool_call_end'; tool: string; output: unknown; duration_ms: number }
  | { type: 'done' }
  | { type: 'error'; message: string }

export interface SSEWriter {
  stream: ReadableStream<Uint8Array>
  emit: (event: SSEEvent) => void
  close: () => void
}

export function createSSEStream(): SSEWriter {
  const encoder = new TextEncoder()
  let controllerRef: ReadableStreamDefaultController<Uint8Array> | null = null
  let closed = false

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controllerRef = controller
    },
    cancel() {
      closed = true
    },
  })

  const emit = (event: SSEEvent) => {
    if (closed || !controllerRef) return
    try {
      controllerRef.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
    } catch {
      // Consumer disconnected — mark closed and drop subsequent writes.
      closed = true
    }
  }

  const close = () => {
    if (closed || !controllerRef) return
    closed = true
    try {
      controllerRef.close()
    } catch {
      // Already closed.
    }
  }

  return { stream, emit, close }
}

export const SSE_HEADERS: Record<string, string> = {
  'Content-Type': 'text/event-stream; charset=utf-8',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
  'X-Accel-Buffering': 'no',
}
