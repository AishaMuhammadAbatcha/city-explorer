// YouTube Data API v3 — search.list (snippet).
//
// Each call costs 100 quota units; the daily free quota is 10,000
// units, so practical cost is ~$0 for MVP usage. We log 0 and move on.
//
// https://developers.google.com/youtube/v3/docs/search/list

export interface YouTubeSearchInput {
  query: string
  max_results?: number
}

export interface YouTubeVideoItem {
  video_id: string
  title: string
  channel: string
  thumbnail: string
  url: string
  published_at: string
}

export interface YouTubeSearchOutput {
  videos: YouTubeVideoItem[]
}

interface YTSnippet {
  title?: string
  channelTitle?: string
  publishedAt?: string
  thumbnails?: { default?: { url?: string }; medium?: { url?: string }; high?: { url?: string } }
}

interface YTItem {
  id?: { videoId?: string }
  snippet?: YTSnippet
}

interface YTResponse {
  items?: YTItem[]
  error?: { message?: string }
}

export async function runYoutubeSearch(input: YouTubeSearchInput): Promise<YouTubeSearchOutput> {
  const apiKey = Deno.env.get('GOOGLE_API_KEY')
  if (!apiKey) throw new Error('GOOGLE_API_KEY is not set')

  const max = Math.min(Math.max(input.max_results ?? 5, 1), 10)
  const url = new URL('https://www.googleapis.com/youtube/v3/search')
  url.searchParams.set('part', 'snippet')
  url.searchParams.set('type', 'video')
  url.searchParams.set('maxResults', String(max))
  url.searchParams.set('q', input.query)
  url.searchParams.set('key', apiKey)

  const res = await fetch(url.toString())
  const json = (await res.json()) as YTResponse
  if (!res.ok) {
    throw new Error(`youtube_search failed: ${res.status} ${json.error?.message ?? res.statusText}`)
  }

  const videos: YouTubeVideoItem[] = (json.items ?? [])
    .filter((it) => !!it.id?.videoId)
    .map((it) => {
      const videoId = it.id!.videoId!
      const thumb =
        it.snippet?.thumbnails?.medium?.url ??
        it.snippet?.thumbnails?.default?.url ??
        it.snippet?.thumbnails?.high?.url ??
        ''
      return {
        video_id: videoId,
        title: it.snippet?.title ?? '',
        channel: it.snippet?.channelTitle ?? '',
        thumbnail: thumb,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        published_at: it.snippet?.publishedAt ?? '',
      }
    })

  return { videos }
}

export const YOUTUBE_SEARCH_DECLARATION = {
  name: 'youtube_search',
  description:
    'Search YouTube for videos matching a query. Use for reviews, tutorials, vlogs, or when the user explicitly wants video content.',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Natural-language search query.' },
      max_results: {
        type: 'integer',
        description: 'Number of videos to return (1-10). Defaults to 5.',
      },
    },
    required: ['query'],
  },
}
