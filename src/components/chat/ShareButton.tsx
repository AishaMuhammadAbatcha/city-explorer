import { useState } from 'react'
import { Share2, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useShareConversation } from '@/hooks/useShareConversation'

interface ShareButtonProps {
  conversationId: string
  compact?: boolean
}

export function ShareButton({ conversationId, compact = false }: ShareButtonProps) {
  const { share } = useShareConversation()
  const [busy, setBusy] = useState(false)
  const [justCopied, setJustCopied] = useState(false)

  const handleShare = async () => {
    if (busy) return
    setBusy(true)
    try {
      const url = await share(conversationId)
      await navigator.clipboard.writeText(url)
      setJustCopied(true)
      toast.success('Share link copied')
      window.setTimeout(() => setJustCopied(false), 1500)
    } catch (err) {
      const detail = err instanceof Error ? err.message : 'Failed to share conversation'
      toast.error(detail)
    } finally {
      setBusy(false)
    }
  }

  const Icon = justCopied ? Check : Share2

  if (compact) {
    return (
      <Button
        size="icon"
        variant="ghost"
        aria-label="Share conversation"
        disabled={busy}
        onClick={handleShare}
        className="text-muted-foreground hover:text-foreground"
      >
        <Icon className="w-4 h-4" />
      </Button>
    )
  }

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={busy}
      onClick={handleShare}
      className="gap-1.5"
    >
      <Icon className="w-3.5 h-3.5" />
      {justCopied ? 'Link copied' : 'Share conversation'}
    </Button>
  )
}
