import { useEffect, useState } from 'react'
import {
  Brain,
  Globe,
  MapPin,
  Youtube,
  BookOpen,
  Compass,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import type { TraceEvent } from '@/types/agent'

interface StepTraceProps {
  trace: TraceEvent[]
  streaming: boolean
}

const TOOL_LABELS: Record<string, string> = {
  web_search: 'Searched web',
  places_search: 'Searched places',
  youtube_search: 'Searched YouTube',
  knowledge_graph: 'Knowledge Graph',
  geocode: 'Geocoded',
}

function ToolIcon({ tool }: { tool: string }) {
  const cls = 'w-3.5 h-3.5'
  switch (tool) {
    case 'web_search':
      return <Globe className={cls} />
    case 'places_search':
      return <MapPin className={cls} />
    case 'youtube_search':
      return <Youtube className={cls} />
    case 'knowledge_graph':
      return <BookOpen className={cls} />
    case 'geocode':
      return <Compass className={cls} />
    default:
      return <Globe className={cls} />
  }
}

function firstStringArg(input: unknown): string {
  if (!input || typeof input !== 'object') return ''
  const o = input as Record<string, unknown>
  for (const key of ['query', 'address']) {
    const v = o[key]
    if (typeof v === 'string' && v.length > 0) return v
  }
  return ''
}

export function StepTrace({ trace, streaming }: StepTraceProps) {
  const [open, setOpen] = useState<boolean>(streaming)

  useEffect(() => {
    if (streaming) setOpen(true)
    else setOpen(false)
  }, [streaming])

  if (trace.length === 0) return null

  const completedToolCalls = trace.filter((e) => e.kind === 'tool_call_end').length

  return (
    <div className="rounded-lg border border-border bg-background/50 text-xs">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-muted/50"
        aria-expanded={open}
      >
        {streaming ? (
          <Brain className="w-3.5 h-3.5 text-primary animate-pulse" />
        ) : (
          <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-500" />
        )}
        <span className="font-medium">
          {streaming
            ? 'Thinking…'
            : `Completed in ${completedToolCalls} ${completedToolCalls === 1 ? 'step' : 'steps'}`}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 ml-auto transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <ol className="px-3 pb-2 pt-0 space-y-1.5 border-t border-border">
          {trace.map((e, i) => {
            if (e.kind === 'step_start') {
              return (
                <li key={i} className="flex items-center gap-2 pt-1.5 text-muted-foreground">
                  <Brain className="w-3.5 h-3.5" />
                  <span className="font-medium text-foreground">{e.label}</span>
                </li>
              )
            }
            if (e.kind === 'tool_call_start') {
              const q = firstStringArg(e.input)
              return (
                <li key={i} className="flex items-center gap-2 pl-4 text-muted-foreground">
                  <ToolIcon tool={e.tool} />
                  <span>
                    {TOOL_LABELS[e.tool] ?? e.tool}
                    {q && <span className="text-foreground"> "{q}"</span>}
                    <span className="opacity-60"> …</span>
                  </span>
                </li>
              )
            }
            if (e.kind === 'tool_call_end') {
              if (e.error) {
                return (
                  <li key={i} className="flex items-start gap-2 pl-4 text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>
                      {e.tool} failed
                      {e.error_message && (
                        <span className="text-muted-foreground"> — {e.error_message}</span>
                      )}
                      <span className="opacity-60"> ({(e.duration_ms / 1000).toFixed(1)}s)</span>
                    </span>
                  </li>
                )
              }
              return (
                <li key={i} className="flex items-center gap-2 pl-4 text-muted-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-500" />
                  <span>
                    {e.summary}
                    <span className="opacity-60"> ({(e.duration_ms / 1000).toFixed(1)}s)</span>
                  </span>
                </li>
              )
            }
            // done
            return (
              <li key={i} className="flex items-center gap-2 pt-1 text-muted-foreground">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-500" />
                <span>Answer ready ({(e.totalMs / 1000).toFixed(1)}s total)</span>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
