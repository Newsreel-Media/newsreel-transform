import { NextRequest, NextResponse } from 'next/server'
import { searchAllImages, searchAllVideos, autoPickMedia } from '@/lib/media-search/search'
import type { MediaItem } from '@/lib/media-search/types'

export const dynamic = 'force-dynamic'

/**
 * GET /api/media-search
 *
 * Query Parameters:
 * - q: search query (required)
 * - mode: 'auto' (single best result) or 'manual' (all results) [default: 'manual']
 * - type: 'image' or 'video' [default: 'image'] (ignored in auto mode)
 * - exclude: comma-separated URLs to exclude from results
 */
export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q')
    const mode = request.nextUrl.searchParams.get('mode') || 'manual'
    const type = request.nextUrl.searchParams.get('type') || 'image'
    const excludeParam = request.nextUrl.searchParams.get('exclude')

    if (!q || q.trim().length === 0) {
      return NextResponse.json({ error: 'Missing search query' }, { status: 400 })
    }

    const excludeUrls = excludeParam
      ? new Set(excludeParam.split(',').map(u => u.trim()).filter(Boolean))
      : undefined

    // Auto mode: return single best result
    if (mode === 'auto') {
      const item = await autoPickMedia(q, excludeUrls)
      return NextResponse.json({ item: item || null })
    }

    // Manual mode: return all results of specified type
    let results: MediaItem[] = []

    if (type === 'video') {
      results = await searchAllVideos(q, 12)
    } else {
      // 'image' type includes both static images and GIFs
      results = await searchAllImages(q, 15)
    }

    // Filter out excluded URLs
    if (excludeUrls) {
      results = results.filter(r => !excludeUrls.has(r.url))
    }

    return NextResponse.json({ results })
  } catch (error: any) {
    console.error('Media search error:', error)
    return NextResponse.json(
      { error: 'Media search failed' },
      { status: 500 }
    )
  }
}
