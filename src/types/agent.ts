export interface Citation {
  url: string
  title: string
  snippet?: string
}

type BaseCard = { id: string }

export type PlaceCard = BaseCard & {
  kind: 'place'
  place_id: string
  name: string
  address: string
  rating?: number
  rating_count?: number
  lat: number
  lng: number
  maps_url: string
  snippet?: string
}

export type VideoCard = BaseCard & {
  kind: 'video'
  video_id: string
  title: string
  channel: string
  thumbnail: string
  url: string
  published_at?: string
}

export type ArticleCard = BaseCard & {
  kind: 'article'
  title: string
  snippet: string
  url: string
  display_link: string
  source?: 'web' | 'kg'
}

export type ProductCard = BaseCard & {
  kind: 'product'
  title: string
  price?: string
  seller?: string
  image?: string
  url: string
}

export type Card = PlaceCard | VideoCard | ArticleCard | ProductCard

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  citations: Citation[]
  cards: Card[]
  created_at: string
}

export type AgentSSEEvent =
  | { type: 'conversation_id'; id: string }
  | { type: 'step_start'; iteration: number; label: string }
  | { type: 'token'; text: string }
  | { type: 'tool_call_start'; tool: string; input: unknown }
  | { type: 'tool_call_end'; tool: string; output: unknown; duration_ms: number; summary?: string }
  | { type: 'done' }
  | { type: 'error'; message: string }
