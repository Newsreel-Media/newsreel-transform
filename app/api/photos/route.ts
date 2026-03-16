import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/photos?q=search+terms
 * Searches Openverse (Creative Commons) for a photo. Free, no API key needed.
 */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')
  if (!query) {
    return NextResponse.json({ url: null })
  }

  try {
    const params = new URLSearchParams({
      q: query,
      page_size: '3',
      license_type: 'commercial',
      mature: 'false',
    })

    const res = await fetch(`https://api.openverse.org/v1/images/?${params}`, {
      headers: { 'User-Agent': 'NewsreelTransform/1.0 (https://newsreel.co)' },
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!res.ok) {
      return NextResponse.json({ url: null })
    }

    const data = await res.json()
    const results = data.results || []

    if (results.length === 0) {
      return NextResponse.json({ url: null })
    }

    // Return the best result
    const best = results[0]
    return NextResponse.json({
      url: best.url || best.thumbnail,
      thumbnail: best.thumbnail || best.url,
      attribution: best.attribution || (best.creator ? `${best.creator} via ${best.source}` : best.source),
    })
  } catch {
    return NextResponse.json({ url: null })
  }
}
