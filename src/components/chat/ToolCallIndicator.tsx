import { Loader2 } from 'lucide-react'

interface ToolCallIndicatorProps {
  tool: string
}

const LABELS: Record<string, string> = {
  web_search: 'Searching the web…',
  places_search: 'Finding places…',
}

export function ToolCallIndicator({ tool }: ToolCallIndicatorProps) {
  const label = LABELS[tool] ?? `Running ${tool}…`
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground px-3 py-1.5 rounded-full bg-muted w-fit">
      <Loader2 className="w-3 h-3 animate-spin" />
      {label}
    </div>
  )
}
