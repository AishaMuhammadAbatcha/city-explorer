import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

// Phase 7 — per-user usage analytics.
//
// Aggregates the rows the edge function logs (messages, tool_calls,
// llm_calls) into three views the /usage page renders:
//
//   today.cost       — rolling-24h total of tool + LLM cost.
//   today.searches   — rolling-24h count of role='user' messages.
//   today.toolCalls  — rolling-24h count of tool_calls rows.
//   today.avgLatency — rolling-24h mean tool_calls.duration_ms.
//   last7Days[]      — daily cost buckets for the 7-day chart.
//   toolHits[]       — per-tool call counts over the 7-day window.
//
// All reads use RLS — the authenticated user only sees their own rows.
// The edge function calls the get_daily_usage RPC (service-role only)
// for cap enforcement; the UI reads the underlying tables directly.

export interface DailyUsage {
  cost: number
  searches: number
  toolCalls: number
  avgLatency: number
}

export interface DailyCostBucket {
  date: string
  cost: number
}

export interface ToolHit {
  tool: string
  count: number
}

export interface UsageStats {
  today: DailyUsage
  last7Days: DailyCostBucket[]
  toolHits: ToolHit[]
  loading: boolean
  error: string | null
  refetch: () => void
}

const EMPTY_TODAY: DailyUsage = { cost: 0, searches: 0, toolCalls: 0, avgLatency: 0 }

function isoDayKey(iso: string): string {
  return iso.slice(0, 10)
}

function last7DayKeys(): string[] {
  const out: string[] = []
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setUTCDate(today.getUTCDate() - i)
    out.push(d.toISOString().slice(0, 10))
  }
  return out
}

export function useUsageStats(): UsageStats {
  const { user } = useAuth()
  const [today, setToday] = useState<DailyUsage>(EMPTY_TODAY)
  const [last7Days, setLast7Days] = useState<DailyCostBucket[]>([])
  const [toolHits, setToolHits] = useState<ToolHit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    if (!user) {
      setToday(EMPTY_TODAY)
      setLast7Days([])
      setToolHits([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)

    try {
      const now = Date.now()
      const day = 24 * 60 * 60 * 1000
      const since24h = new Date(now - day).toISOString()
      const since7d = new Date(now - 7 * day).toISOString()

      // 1. Conversations owned by the user. Subsequent filters lean on
      //    this list so we don't have to traverse multiple joins via
      //    PostgREST.
      const { data: convos, error: convosErr } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', user.id)
      if (convosErr) throw new Error(convosErr.message)
      const convoIds = (convos ?? []).map((c) => c.id)

      if (convoIds.length === 0) {
        setToday(EMPTY_TODAY)
        setLast7Days(
          last7DayKeys().map((date) => ({ date, cost: 0 })),
        )
        setToolHits([])
        setLoading(false)
        return
      }

      // 2. Messages in the 7-day window — we need their ids to scope
      //    tool_calls/llm_calls, plus created_at/role for the "today"
      //    search count.
      const { data: msgsRaw, error: msgsErr } = await supabase
        .from('messages')
        .select('id, role, created_at')
        .in('conversation_id', convoIds)
        .gt('created_at', since7d)
      if (msgsErr) throw new Error(msgsErr.message)
      const msgs = msgsRaw ?? []
      const messageIds = msgs.map((m) => m.id)

      const searches24h = msgs.filter(
        (m) => m.role === 'user' && m.created_at > since24h,
      ).length

      // 3. tool_calls + llm_calls in the 7-day window.
      let toolCalls: {
        tool_name: string
        cost_usd: number
        duration_ms: number | null
        created_at: string
      }[] = []
      let llmCalls: { cost_usd: number; created_at: string }[] = []

      if (messageIds.length > 0) {
        const [{ data: tcData, error: tcErr }, { data: lcData, error: lcErr }] =
          await Promise.all([
            supabase
              .from('tool_calls')
              .select('tool_name, cost_usd, duration_ms, created_at')
              .in('message_id', messageIds)
              .gt('created_at', since7d),
            supabase
              .from('llm_calls')
              .select('cost_usd, created_at')
              .in('message_id', messageIds)
              .gt('created_at', since7d),
          ])
        if (tcErr) throw new Error(tcErr.message)
        if (lcErr) throw new Error(lcErr.message)
        toolCalls = (tcData ?? []) as typeof toolCalls
        llmCalls = (lcData ?? []) as typeof llmCalls
      }

      // Today (rolling 24h) aggregates.
      const tc24h = toolCalls.filter((r) => r.created_at > since24h)
      const lc24h = llmCalls.filter((r) => r.created_at > since24h)
      const cost24h =
        tc24h.reduce((s, r) => s + Number(r.cost_usd ?? 0), 0) +
        lc24h.reduce((s, r) => s + Number(r.cost_usd ?? 0), 0)
      const latencySamples = tc24h
        .map((r) => r.duration_ms ?? 0)
        .filter((n) => n > 0)
      const avgLatency =
        latencySamples.length > 0
          ? Math.round(latencySamples.reduce((s, n) => s + n, 0) / latencySamples.length)
          : 0

      setToday({
        cost: cost24h,
        searches: searches24h,
        toolCalls: tc24h.length,
        avgLatency,
      })

      // 7-day cost buckets (UTC days).
      const keys = last7DayKeys()
      const bucket = new Map<string, number>()
      for (const k of keys) bucket.set(k, 0)
      for (const r of toolCalls) {
        const k = isoDayKey(r.created_at)
        if (bucket.has(k)) bucket.set(k, (bucket.get(k) ?? 0) + Number(r.cost_usd ?? 0))
      }
      for (const r of llmCalls) {
        const k = isoDayKey(r.created_at)
        if (bucket.has(k)) bucket.set(k, (bucket.get(k) ?? 0) + Number(r.cost_usd ?? 0))
      }
      setLast7Days(keys.map((date) => ({ date, cost: bucket.get(date) ?? 0 })))

      // Tool hit counts over 7 days.
      const hits = new Map<string, number>()
      for (const r of toolCalls) {
        hits.set(r.tool_name, (hits.get(r.tool_name) ?? 0) + 1)
      }
      setToolHits(
        Array.from(hits.entries())
          .map(([tool, count]) => ({ tool, count }))
          .sort((a, b) => b.count - a.count),
      )
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err)
      console.error('useUsageStats error:', detail)
      setError(detail)
      setToday(EMPTY_TODAY)
      setLast7Days([])
      setToolHits([])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { today, last7Days, toolHits, loading, error, refetch: fetchStats }
}
