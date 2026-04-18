import { Bookmark } from 'lucide-react'
import type { Card } from '@/types/agent'
import { useAuth } from '@/contexts/AuthContext'
import { useSavedResults } from '@/hooks/useSavedResults'
import {
  PlaceCard,
  VideoCard,
  ArticleCard,
  ProductCard,
} from '@/components/chat/cards'

const KIND_ORDER: Card['kind'][] = ['place', 'product', 'video', 'article']
const KIND_LABEL: Record<Card['kind'], string> = {
  place: 'Places',
  product: 'Products',
  video: 'Videos',
  article: 'Articles',
}

function renderCard(card: Card, sourceMessageId: string | undefined) {
  const key = `${card.kind}:${card.id}`
  switch (card.kind) {
    case 'place':
      return <PlaceCard key={key} card={card} sourceMessageId={sourceMessageId} />
    case 'video':
      return <VideoCard key={key} card={card} sourceMessageId={sourceMessageId} />
    case 'article':
      return <ArticleCard key={key} card={card} sourceMessageId={sourceMessageId} />
    case 'product':
      return <ProductCard key={key} card={card} sourceMessageId={sourceMessageId} />
  }
}

export default function Saved() {
  const { isAnonymous } = useAuth()
  const { saved, loading } = useSavedResults()

  if (isAnonymous) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Saved</h1>
          <p className="text-muted-foreground text-sm">Your bookmarked results.</p>
        </div>
        <div className="rounded-xl border border-border bg-muted/30 p-8 text-center space-y-2">
          <Bookmark className="w-8 h-8 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Saved results are only available after you create an account. Head to
            Settings to upgrade.
          </p>
        </div>
      </div>
    )
  }

  const grouped: Record<Card['kind'], typeof saved> = {
    place: [],
    product: [],
    video: [],
    article: [],
  }
  for (const r of saved) grouped[r.card.kind].push(r)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Saved</h1>
        <p className="text-muted-foreground text-sm">Your bookmarked results.</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : saved.length === 0 ? (
        <div className="rounded-xl border border-border bg-muted/30 p-8 text-center space-y-2">
          <Bookmark className="w-8 h-8 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No saved results yet. Tap the bookmark on any card to save it.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {KIND_ORDER.filter((k) => grouped[k].length > 0).map((kind) => (
            <section key={kind} className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {KIND_LABEL[kind]} · {grouped[kind].length}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {grouped[kind].map((r) =>
                  renderCard(r.card, r.source_message_id ?? undefined),
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
