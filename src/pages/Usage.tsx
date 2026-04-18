import { BarChart3 } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useUsageStats } from '@/hooks/useUsageStats'

// Phase 7 — user-facing analytics page.
// Pulls from useUsageStats (tool_calls + llm_calls + messages under
// RLS) and renders today's KPIs, a 7-day cost trend, and a 7-day
// tool hit leaderboard. No aggregate or cross-user data is exposed.

const TOOL_LABELS: Record<string, string> = {
  web_search: 'Web search',
  places_search: 'Places',
  youtube_search: 'YouTube',
  knowledge_graph: 'Knowledge Graph',
  geocode: 'Geocode',
  shopping_search: 'Shopping',
}

function toolLabel(t: string): string {
  return TOOL_LABELS[t] ?? t
}

function formatCost(v: number): string {
  return `$${v.toFixed(4)}`
}

function formatShortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

function Kpi({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold tracking-tight mt-1">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  )
}

export default function Usage() {
  const { today, last7Days, toolHits, loading, error } = useUsageStats()

  const hasAny =
    today.searches > 0 ||
    today.toolCalls > 0 ||
    last7Days.some((d) => d.cost > 0) ||
    toolHits.length > 0

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <BarChart3 className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usage</h1>
          <p className="text-muted-foreground text-sm">
            Your search volume, cost, and latency.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          Couldn’t load usage stats: {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : !hasAny ? (
        <div className="rounded-xl border border-border bg-muted/30 p-10 text-center space-y-2">
          <BarChart3 className="w-8 h-8 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No usage yet. Run a search to see stats.
          </p>
        </div>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-sm font-semibold tracking-tight text-muted-foreground uppercase">
              Today (last 24h)
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Kpi label="Searches" value={String(today.searches)} />
              <Kpi label="Tool calls" value={String(today.toolCalls)} />
              <Kpi label="Spent" value={formatCost(today.cost)} hint="Tools + LLM" />
              <Kpi
                label="Avg latency"
                value={`${today.avgLatency} ms`}
                hint="Per tool call"
              />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold tracking-tight text-muted-foreground uppercase">
              Last 7 days: cost
            </h2>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={last7Days}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatShortDate}
                      className="text-xs"
                      stroke="currentColor"
                    />
                    <YAxis
                      tickFormatter={(v: number) => `$${v.toFixed(3)}`}
                      className="text-xs"
                      stroke="currentColor"
                      width={70}
                    />
                    <Tooltip
                      formatter={(v: number) => [formatCost(v), 'Cost']}
                      labelFormatter={formatShortDate}
                      contentStyle={{
                        background: 'var(--color-popover, #111)',
                        border: '1px solid var(--color-border, #333)',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="cost" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold tracking-tight text-muted-foreground uppercase">
              Tools used (last 7 days)
            </h2>
            {toolHits.length === 0 ? (
              <div className="rounded-xl border border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                No tool calls in the last 7 days.
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card p-4">
                <div
                  style={{
                    height: Math.max(toolHits.length * 40, 160),
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={toolHits.map((t) => ({
                        ...t,
                        toolLabel: toolLabel(t.tool),
                      }))}
                      layout="vertical"
                      margin={{ left: 24, right: 16 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis
                        type="number"
                        allowDecimals={false}
                        className="text-xs"
                        stroke="currentColor"
                      />
                      <YAxis
                        type="category"
                        dataKey="toolLabel"
                        width={120}
                        className="text-xs"
                        stroke="currentColor"
                      />
                      <Tooltip
                        formatter={(v: number) => [v, 'Calls']}
                        contentStyle={{
                          background: 'var(--color-popover, #111)',
                          border: '1px solid var(--color-border, #333)',
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="count" fill="#16a34a" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </section>
        </>
      )}

      <p className="text-xs text-muted-foreground">
        Daily limits: $0.10 cost · 50 searches. Resets 24h after your first activity.
      </p>
    </div>
  )
}
