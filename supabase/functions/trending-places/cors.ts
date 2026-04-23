const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://tr-ace.vercel.app',
]

export function corsHeaders(origin: string | null): Record<string, string> {
  const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

export function handlePreflight(req: Request): Response | null {
  if (req.method !== 'OPTIONS') return null
  return new Response(null, {
    status: 204,
    headers: corsHeaders(req.headers.get('origin')),
  })
}
