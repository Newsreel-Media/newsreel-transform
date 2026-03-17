import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/submit
 * Stores a publisher's story submission for review.
 * For now, logs to console. Later: Supabase, email, or Slack webhook.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Log the submission (visible in Render logs)
    console.log('=== NEW STORY SUBMISSION ===')
    console.log(`Author: ${body.author}`)
    console.log(`Publication: ${body.publication}`)
    console.log(`Email: ${body.email}`)
    console.log(`Source: ${body.source_url}`)
    console.log(`Headline: ${body.story?.story_headline}`)
    console.log(`Slides: ${body.story?.slides?.length}`)
    console.log(`Sponsor: ${body.sponsor ? body.sponsor.name : 'none'}`)
    console.log(`Submitted: ${body.submitted_at}`)
    console.log('===========================')

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}
