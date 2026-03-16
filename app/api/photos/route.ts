import { NextRequest, NextResponse } from 'next/server'

// Giphy public beta key (free, rate limited but fine for prototype)
const GIPHY_KEY = 'dc6zaTOxFJmzC'

/**
 * GET /api/photos?q=search+terms&type=photo|gif
 * Photos from Openverse (Creative Commons), GIFs from Giphy.
 */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')
  const type = request.nextUrl.searchParams.get('type') || 'photo'

  if (!query) {
    return NextResponse.json({ url: null })
  }

  try {
    if (type === 'gif') {
      return await searchGiphy(query)
    }
    return await searchOpenverse(query)
  } catch {
    return NextResponse.json({ url: null })
  }
}

async function searchOpenverse(query: string) {
  const params = new URLSearchParams({
    q: query,
    page_size: '3',
    license_type: 'commercial',
    mature: 'false',
  })

  const res = await fetch(`https://api.openverse.org/v1/images/?${params}`, {
    headers: { 'User-Agent': 'NewsreelTransform/1.0 (https://newsreel.co)' },
  })

  if (!res.ok) return NextResponse.json({ url: null })

  const data = await res.json()
  const results = data.results || []
  if (results.length === 0) return NextResponse.json({ url: null })

  const best = results[0]
  return NextResponse.json({
    url: best.url || best.thumbnail,
    thumbnail: best.thumbnail || best.url,
    type: 'photo',
    attribution: best.attribution || (best.creator ? `${best.creator} via ${best.source}` : best.source),
  })
}

async function searchGiphy(query: string) {
  const params = new URLSearchParams({
    api_key: GIPHY_KEY,
    q: query,
    limit: '3',
    rating: 'pg',
  })

  const res = await fetch(`https://api.giphy.com/v1/gifs/search?${params}`)
  if (!res.ok) return NextResponse.json({ url: null })

  const data = await res.json()
  const results = data.data || []
  if (results.length === 0) return NextResponse.json({ url: null })

  const best = results[0]
  return NextResponse.json({
    url: best.images?.original?.url || best.images?.downsized?.url,
    thumbnail: best.images?.fixed_width?.url || best.images?.downsized?.url,
    type: 'gif',
    attribution: 'GIPHY',
  })
}
