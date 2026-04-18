import { useState } from 'react'
import { useNavigate } from 'react-router'
import { formatDistanceToNow } from 'date-fns'
import { MessageSquare, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ShareButton } from '@/components/chat/ShareButton'
import { useConversationList } from '@/hooks/useConversationList'

export default function History() {
  const { conversations, loading, remove } = useConversationList()
  const navigate = useNavigate()
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setBusyId(id)
    const { error } = await remove(id)
    setBusyId(null)
    setConfirmingId(null)
    if (error) {
      toast.error(error.message || 'Failed to delete conversation')
    } else {
      toast.success('Conversation deleted')
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">History</h1>
        <p className="text-muted-foreground text-sm">
          Your recent searches. Click any row to reopen it.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : conversations.length === 0 ? (
        <div className="rounded-xl border border-border bg-muted/30 p-8 text-center space-y-2">
          <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No conversations yet. Start searching to build history.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {conversations.map((c) => {
            const isConfirming = confirmingId === c.id
            const isBusy = busyId === c.id
            return (
              <li
                key={c.id}
                className="group flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-primary"
              >
                <button
                  type="button"
                  onClick={() => navigate(`/search?c=${c.id}`)}
                  className="flex-1 text-left min-w-0"
                >
                  <p className="text-sm font-medium truncate">
                    {c.title?.trim() ? c.title : 'Untitled conversation'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(c.updated_at), { addSuffix: true })}
                  </p>
                </button>
                {isConfirming ? (
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={isBusy}
                      onClick={() => handleDelete(c.id)}
                    >
                      {isBusy ? 'Deleting…' : 'Delete'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={isBusy}
                      onClick={() => setConfirmingId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    <ShareButton conversationId={c.id} compact />
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Delete conversation"
                      onClick={() => setConfirmingId(c.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
