/**
 * Media Search Type Definitions
 * Unified interface for all media sources
 */

export type MediaSource =
  | 'shutterstock'
  | 'unsplash'
  | 'pexels'
  | 'pixabay'
  | 'coverr'
  | 'youtube'
  | 'giphy'
  | 'flickr'
  | 'newsapi'
  | 'gnews'
  | 'wikimedia'

export type MediaType = 'image' | 'video'

export interface MediaItem {
  url: string                    // Direct link to media or YouTube watch URL
  thumbnail: string              // Preview/thumbnail image
  source: MediaSource           // Which platform
  description: string | null     // Title/caption
  keywords: string[]
  mediaType: MediaType
  duration: number | null        // Seconds (videos only)
  attribution: string | null     // Credit line
}

export const SOURCE_LABELS: Record<MediaSource, string> = {
  shutterstock: 'Shutterstock',
  unsplash: 'Unsplash',
  pexels: 'Pexels',
  pixabay: 'Pixabay',
  coverr: 'Coverr',
  youtube: 'YouTube',
  giphy: 'Giphy',
  flickr: 'Flickr',
  newsapi: 'NewsAPI',
  gnews: 'GNews',
  wikimedia: 'Wikimedia Commons',
}

export const IMAGE_SOURCES: MediaSource[] = [
  'shutterstock',
  'unsplash',
  'pexels',
  'pixabay',
  'coverr',
  'giphy',
  'flickr',
  'newsapi',
  'gnews',
  'wikimedia',
]

export const VIDEO_SOURCES: MediaSource[] = ['youtube', 'pexels', 'pixabay', 'coverr']

export const GIF_SOURCE: MediaSource = 'giphy'
