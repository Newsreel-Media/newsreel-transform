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
  const count = parseInt(request.nextUrl.searchParams.get('count') || '1', 10)

  if (!query) {
    return NextResponse.json({ url: null })
  }

  try {
    if (count > 1) {
      // Return multiple results for photo swap UI
      if (type === 'gif') {
        return await searchGiphyMulti(query, count)
      }
      return await searchOpenverseMulti(query, count)
    }
    if (type === 'gif') {
      return await searchGiphy(query)
    }
    return await searchOpenverse(query)
  } catch {
    return NextResponse.json({ url: null })
  }
}

async function searchOpenverse(query: string) {
  try {
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
  } catch {
    return NextResponse.json({ url: null })
  }
}

async function searchGiphy(query: string) {
  try {
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
  } catch {
    return NextResponse.json({ url: null })
  }
}

async function searchOpenverseMulti(query: string, count: number) {
  try {
    const params = new URLSearchParams({
      q: query,
      page_size: String(Math.min(count, 12)),
      license_type: 'commercial',
      mature: 'false',
    })

    const res = await fetch(`https://api.openverse.org/v1/images/?${params}`, {
      headers: { 'User-Agent': 'NewsreelTransform/1.0 (https://newsreel.co)' },
    })

    if (!res.ok) return NextResponse.json({ results: [] })

    const data = await res.json()
    const results = (data.results || []).map((r: any) => ({
      url: r.url || r.thumbnail,
      thumbnail: r.thumbnail || r.url,
      type: 'photo' as const,
      attribution: r.attribution || (r.creator ? `${r.creator} via ${r.source}` : r.source),
    }))

    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ results: [] })
  }
}

async function searchGiphyMulti(query: string, count: number) {
  try {
    const params = new URLSearchParams({
      api_key: GIPHY_KEY,
      q: query,
      limit: String(Math.min(count, 12)),
      rating: 'pg',
    })

    const res = await fetch(`https://api.giphy.com/v1/gifs/search?${params}`)
    if (!res.ok) return NextResponse.json({ results: [] })

    const data = await res.json()
    const results = (data.data || []).map((r: any) => ({
      url: r.images?.original?.url || r.images?.downsized?.url,
      thumbnail: r.images?.fixed_width?.url || r.images?.downsized?.url,
      type: 'gif' as const,
      attribution: 'GIPHY',
    }))

    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ results: [] })
  }
}
