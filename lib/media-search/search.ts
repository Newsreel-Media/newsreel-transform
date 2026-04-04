import type { MediaItem } from './types'
import { searchShutterstock } from './sources/shutterstock'
import { searchUnsplash } from './sources/unsplash'
import { searchPexelsImages, searchPexelsVideos } from './sources/pexels'
import { searchPixabayImages, searchPixabayVideos } from './sources/pixabay'
import { searchCoverrImages, searchCoverrVideos } from './sources/coverr'
import { searchYouTube } from './sources/youtube'
import { searchGiphy } from './sources/giphy'
import { searchFlickrImages } from './sources/flickr'
import { searchNewsApiImages } from './sources/newsapi'
import { searchGNewsImages } from './sources/gnews'
import { searchWikimediaCommons } from './sources/wikimedia'

// Source priority order for display
const SOURCE_PRIORITY = {
  'giphy': 0,        // GIFs first!
  'unsplash': 1,
  'pexels': 2,
  'pixabay': 3,
  'coverr': 4,
  'shutterstock': 5,
  'flickr': 6,
  'wikimedia': 7,
  'newsapi': 8,
  'gnews': 9,
  'youtube': 10,
}

/**
 * Search all image sources in parallel, return SORTED by priority (GIFs first!)
 */
export async function searchAllImages(query: string, perSource = 20): Promise<MediaItem[]> {
  const [
    shutterstock,
    unsplash,
    pexelsImg,
    pixabayImg,
    coverrImg,
    giphy,
    flickr,
    newsapi,
    gnews,
    wikimedia,
  ] = await Promise.allSettled([
    searchShutterstock(query, perSource),
    searchUnsplash(query, perSource),
    searchPexelsImages(query, perSource),
    searchPixabayImages(query, perSource),
    searchCoverrImages(query, perSource),
    searchGiphy(query, perSource),
    searchFlickrImages(query, perSource),
    searchNewsApiImages(query, perSource),
    searchGNewsImages(query, perSource),
    searchWikimediaCommons(query, perSource),
  ])

  const results: MediaItem[] = []

  // Add in PRIORITY ORDER - Giphy (GIFs) FIRST!
  if (giphy.status === 'fulfilled') results.push(...giphy.value)
  if (unsplash.status === 'fulfilled') results.push(...unsplash.value)
  if (pexelsImg.status === 'fulfilled') results.push(...pexelsImg.value)
  if (pixabayImg.status === 'fulfilled') results.push(...pixabayImg.value)
  if (coverrImg.status === 'fulfilled') results.push(...coverrImg.value)
  if (shutterstock.status === 'fulfilled') results.push(...shutterstock.value)
  if (flickr.status === 'fulfilled') results.push(...flickr.value)
  if (wikimedia.status === 'fulfilled') results.push(...wikimedia.value)
  if (newsapi.status === 'fulfilled') results.push(...newsapi.value)
  if (gnews.status === 'fulfilled') results.push(...gnews.value)

  return results
}

/**
 * Search all video sources in parallel
 */
export async function searchAllVideos(query: string, limit = 12): Promise<MediaItem[]> {
  const [youtube, pexelsVid, pixabayVid, coverrVid] = await Promise.allSettled([
    searchYouTube(query, 8),
    searchPexelsVideos(query, 4),
    searchPixabayVideos(query, 4),
    searchCoverrVideos(query, 4),
  ])

  const results: MediaItem[] = []
  if (youtube.status === 'fulfilled') results.push(...youtube.value)
  if (pexelsVid.status === 'fulfilled') results.push(...pexelsVid.value)
  if (pixabayVid.status === 'fulfilled') results.push(...pixabayVid.value)
  if (coverrVid.status === 'fulfilled') results.push(...coverrVid.value)

  return results.slice(0, limit)
}

/**
 * Auto-pick best media by preference: GIF > image > video > YouTube
 * Aggressive GIF preference for visual variety
 */
export async function autoPickMedia(query: string, excludeUrls?: Set<string>): Promise<MediaItem | null> {
  // 1. TRY GIPHY FIRST (GIFs are engaging, should be first choice)
  try {
    const gifs = await searchGiphy(query, 5)
    const gifResult = gifs.find(g => !excludeUrls?.has(g.url))
    if (gifResult) {
      return gifResult
    }
  } catch (e) {
    // Giphy search failed, try next source
  }

  // 2. THEN TRY STATIC IMAGES
  try {
    const images = await searchAllImages(query, 8)
    const imageResult = images.find(i => !excludeUrls?.has(i.url))
    if (imageResult) {
      return imageResult
    }
  } catch (e) {
    // Image search failed, try next source
  }

  // 3. THEN TRY DOWNLOADABLE VIDEOS
  try {
    const videos = await searchAllVideos(query, 6)
    const downloadableVideo = videos.find(
      v => v.source !== 'youtube' && !excludeUrls?.has(v.url)
    )
    if (downloadableVideo) {
      return downloadableVideo
    }
  } catch (e) {
    // Video search failed, try next source
  }

  // 4. LASTLY TRY YOUTUBE (embeds, not downloads)
  try {
    const youtubeVideos = await searchYouTube(query, 3)
    const youtubeVideo = youtubeVideos.find(v => !excludeUrls?.has(v.url))
    if (youtubeVideo) {
      return youtubeVideo
    }
  } catch (e) {
    // YouTube search failed
  }
  return null
}
