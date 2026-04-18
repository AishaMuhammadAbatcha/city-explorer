import { useCallback } from 'react'
import { supabase } from '@/lib/supabase'

function buildShareUrl(slug: string): string {
  return `${window.location.origin}/share/${slug}`
}

export function useShareConversation() {
  const share = useCallback(async (conversationId: string): Promise<string> => {
    const { data: existing, error: selErr } = await supabase
      .from('conversations')
      .select('share_slug, shared')
      .eq('id', conversationId)
      .maybeSingle()

    if (selErr) throw new Error(selErr.message)
    if (!existing) throw new Error('Conversation not found')

    // Reuse the slug across toggle cycles so a stable link survives
    // an unshare/re-share round trip.
    let slug = existing.share_slug
    const nextRow: { shared: boolean; share_slug?: string } = { shared: true }
    if (!slug) {
      slug = crypto.randomUUID()
      nextRow.share_slug = slug
    }

    const { error: updErr } = await supabase
      .from('conversations')
      .update(nextRow)
      .eq('id', conversationId)

    if (updErr) throw new Error(updErr.message)
    return buildShareUrl(slug)
  }, [])

  const unshare = useCallback(async (conversationId: string): Promise<void> => {
    const { error } = await supabase
      .from('conversations')
      .update({ shared: false })
      .eq('id', conversationId)
    if (error) throw new Error(error.message)
  }, [])

  return { share, unshare }
}
