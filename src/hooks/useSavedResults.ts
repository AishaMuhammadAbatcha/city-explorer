import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Card } from '@/types/agent'

export interface SavedResult {
  id: string
  card: Card
  note: string | null
  source_message_id: string | null
  created_at: string
}

function cardKey(card: Card): string {
  return `${card.kind}:${card.id}`
}

interface SavedRow {
  id: string
  card: unknown
  note: string | null
  source_message_id: string | null
  created_at: string
}

export function useSavedResults() {
  const { user } = useAuth()
  const [saved, setSaved] = useState<SavedResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    if (!user) {
      setSaved([])
      setLoading(false)
      return
    }
    setLoading(true)
    supabase
      .from('saved_results')
      .select('id, card, note, source_message_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.error('useSavedResults fetch error:', error.message)
          setSaved([])
          setLoading(false)
          return
        }
        setSaved(
          (data ?? []).map((r: SavedRow) => ({
            id: r.id,
            card: r.card as Card,
            note: r.note,
            source_message_id: r.source_message_id,
            created_at: r.created_at,
          })),
        )
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user])

  const save = useCallback(
    async (card: Card, sourceMessageId?: string) => {
      if (!user) return { error: new Error('No user') }
      const { data, error } = await supabase
        .from('saved_results')
        .insert({
          user_id: user.id,
          card: card as unknown as Record<string, unknown>,
          source_message_id: sourceMessageId ?? null,
        })
        .select('id, card, note, source_message_id, created_at')
        .single()
      if (error) {
        // 23505 = unique violation (already saved). Silent success.
        if (error.code === '23505') return { error: null }
        console.error('saved_results insert error:', error.message)
        return { error: new Error(error.message) }
      }
      if (data) {
        setSaved((prev) => [
          {
            id: data.id,
            card: data.card as Card,
            note: data.note,
            source_message_id: data.source_message_id,
            created_at: data.created_at,
          },
          ...prev,
        ])
      }
      return { error: null }
    },
    [user],
  )

  const remove = useCallback(
    async (id: string) => {
      if (!user) return { error: new Error('No user') }
      const { error } = await supabase.from('saved_results').delete().eq('id', id)
      if (error) {
        console.error('saved_results delete error:', error.message)
        return { error: new Error(error.message) }
      }
      setSaved((prev) => prev.filter((r) => r.id !== id))
      return { error: null }
    },
    [user],
  )

  const isSaved = useCallback(
    (card: Card): SavedResult | null => {
      const key = cardKey(card)
      return saved.find((r) => cardKey(r.card) === key) ?? null
    },
    [saved],
  )

  return { saved, loading, save, remove, isSaved }
}
