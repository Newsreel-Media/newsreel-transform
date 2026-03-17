import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

const SYSTEM_PROMPT = `You are a Newsreel story writer. You write stories in AP Style for a mobile news app called Newsreel. Your stories are structured as slide-based briefs.

STYLE GUIDE:
- Fun, engaging AND informative
- Brevity with substance - Short but not shallow
- Flow matters - Each slide should connect smoothly to the next
- Active voice, punchy headlines
- Each slide body should be one or two sentences maximum
- NEVER use the words "Fresh" or "Blasted" - these are banned

STORY STRUCTURE:
- Slide 1: The hook. Use "The hook" as the subheadline. This is the attention-grabbing opening.
- Slides 2+: The story body. Each slide uses ONE of these key phrases as the subheadline:
  * "Zoom in" - Highlight specific, granular details
  * "Zoom out" - Provide the bigger picture, broader context
  * "Rewind" - Brief timeline or background
  * "By the numbers" - A meaningful stat or fact
  * "What to watch for" - What could happen next
  * "Counterpoint" - Alternate perspective or opposing view
  * "Yes, but..." - A key caveat or limitation
  * "Food for thought" - An insight for deeper reflection
  * "Tangent" - A related but tangential point
- Use varied key phrases across slides. Don't repeat the same phrase.

TRIGGER WARNINGS:
- If the topic involves sensitive content (violence, suicide, sexual assault, etc.), the FIRST slide must be a trigger warning.
- For trigger warning slides, use "Content warning" as the subheadline.

QUICK POLL:
- Always generate a quick_poll: a "this or that" opinion question related to the story
- The question should be a genuine debate point, not a factual question
- option_a and option_b should be short (under 6 words each), representing two sides
- Example: "Should cities ban e-scooters?" / "Yes, too dangerous" / "No, they reduce traffic"

QUIZ:
- Always generate a quiz at the end
- Medium-hard question reinforcing a key detail
- 4 concise answer choices, exactly one correct
- The correct answer must NOT be a number or percentage
- Mark which answer is correct using the correct_answer field (a, b, c, or d)

IMAGE QUERIES:
- For each slide, provide an image_query: a short search phrase (3-5 words) that could find a relevant photo on Unsplash.

OUTPUT FORMAT:
Return valid JSON with this exact structure:
{
  "story_headline": "Short punchy headline in active voice",
  "subhead": "A brief subtitle providing additional context",
  "source_name": "The publication name",
  "slides": [
    {
      "subheadline": "The hook",
      "content": "One or two sentences max.",
      "image_query": "relevant photo search terms"
    }
  ],
  "quiz": {
    "question": "The quiz question?",
    "answers": {
      "a": "Option A",
      "b": "Option B",
      "c": "Option C",
      "d": "Option D"
    },
    "correct_answer": "a"
  },
  "guess": {
    "question": "Before you read: what do you think about [topic]?",
    "options": ["Option 1", "Option 2", "Option 3"]
  },
  "quick_poll": {
    "question": "A concise this-or-that opinion question related to the story",
    "option_a": "Short position A",
    "option_b": "Short position B"
  }
}

IMPORTANT: Return ONLY valid JSON. No markdown, no code fences, no explanation.`

// Article text extraction - regex-based, no external dependencies
function extractArticleText(html: string): { title: string; text: string; siteName: string } {
  // Extract title
  let title = ""
  const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
  const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  title = ogTitle?.[1] || titleTag?.[1] || ""
  title = title.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, '"')

  // Extract site name
  let siteName = ""
  const ogSite = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i)
  if (ogSite) siteName = ogSite[1]

  // Try to extract from <article> tag first
  let articleText = ""
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
  if (articleMatch) {
    articleText = extractParagraphs(articleMatch[1])
  }

  // Fallback: extract all <p> tags
  if (!articleText || articleText.length < 200) {
    articleText = extractParagraphs(html)
  }

  // Final fallback: strip all HTML tags
  if (!articleText || articleText.length < 100) {
    articleText = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<header[\s\S]*?<\/header>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  }

  // Trim to ~5000 chars to avoid token overflow
  if (articleText.length > 5000) {
    articleText = articleText.slice(0, 5000) + "..."
  }

  return { title, text: articleText, siteName }
}

function extractParagraphs(html: string): string {
  const paragraphs: string[] = []
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi
  let match
  while ((match = pRegex.exec(html)) !== null) {
    const text = match[1]
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim()
    if (text.length > 20) {
      paragraphs.push(text)
    }
  }
  return paragraphs.join("\n\n")
}

// Simple in-memory rate limiter: 10 transforms per IP per hour
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 3600000 }) // 1 hour
    return true
  }
  if (entry.count >= 10) return false
  entry.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again in an hour." },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { url, slideCount } = body

    if (!url) {
      return NextResponse.json({ error: "Missing url parameter" }, { status: 400 })
    }

    // SSRF protection: validate URL is not targeting internal/private networks
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
    }

    if (parsedUrl.protocol === 'file:') {
      return NextResponse.json({ error: "file:// URLs are not allowed" }, { status: 400 })
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return NextResponse.json({ error: "Only http and https URLs are allowed" }, { status: 400 })
    }

    const hostname = parsedUrl.hostname
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '[::1]' ||
      hostname.match(/^(127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.)/)
    ) {
      return NextResponse.json({ error: "URLs targeting internal networks are not allowed" }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 })
    }

    // Fetch the article with realistic browser headers
    let articleResponse: Response
    try {
      articleResponse = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          "Cache-Control": "no-cache",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-User": "?1",
          "Upgrade-Insecure-Requests": "1",
        },
        redirect: "follow",
      })
    } catch (fetchErr) {
      return NextResponse.json(
        { error: `Could not reach the site. It may be blocking external requests.` },
        { status: 400 }
      )
    }

    if (!articleResponse.ok) {
      return NextResponse.json(
        { error: `Failed to fetch article (HTTP ${articleResponse.status}). Some sites block automated access. Try a BBC, NPR, Wikipedia, or AP News article.` },
        { status: 422 }
      )
    }

    const html = await articleResponse.text()
    const { title, text, siteName } = extractArticleText(html)

    if (!text || text.length < 50) {
      return NextResponse.json(
        { error: "This page doesn't have enough article content. It may be behind a paywall or use heavy JavaScript rendering." },
        { status: 422 }
      )
    }

    const numSlides = Math.min(Math.max(Number(slideCount) || 5, 3), 8)

    const userMessage = `Transform this article into a Newsreel brief story.

ARTICLE TITLE: ${title}
SOURCE: ${siteName || new URL(url).hostname}
URL: ${url}

ARTICLE TEXT:
${text}

Number of slides: EXACTLY ${numSlides} (not counting any trigger warning slide if needed).

CRITICAL RULES:
- You MUST generate EXACTLY ${numSlides} slides, no more, no less
- EVERY slide MUST have both "subheadline" AND "content" filled with substantive content
- Slide 1 must use "The hook" key phrase
- Each remaining slide uses a DIFFERENT key phrase from the list
- Each slide body is 1-2 sentences with real substance
- Include a quiz, a guess question, and a quick_poll
- Return ONLY valid JSON`

    // Call Claude with a 30-second timeout
    const anthropic = new Anthropic({ apiKey })
    const claudePromise = anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [
        { role: "user", content: userMessage },
      ],
      system: SYSTEM_PROMPT,
    })

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Claude API timed out after 30 seconds")), 30000)
    )

    let message: Anthropic.Message
    try {
      message = await Promise.race([claudePromise, timeoutPromise])
    } catch (timeoutErr: any) {
      return NextResponse.json(
        { error: timeoutErr.message || "The AI took too long to respond. Please try again." },
        { status: 504 }
      )
    }

    const content = message.content[0]
    if (content.type !== "text") {
      return NextResponse.json({ error: "Unexpected response format" }, { status: 500 })
    }

    let cleaned = content.text.trim()
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "")
    }

    let storyData: any
    try {
      storyData = JSON.parse(cleaned)
    } catch {
      return NextResponse.json(
        { error: "AI returned an invalid response. Please try again." },
        { status: 502 }
      )
    }

    // Default missing image_query to the story headline
    if (storyData.slides && Array.isArray(storyData.slides)) {
      for (const slide of storyData.slides) {
        if (!slide.image_query) {
          slide.image_query = storyData.story_headline || title || "news"
        }
      }
    }

    // Add source URL
    storyData.source_url = url
    if (!storyData.source_name) {
      storyData.source_name = siteName || new URL(url).hostname
    }

    return NextResponse.json({ story: storyData })
  } catch (error: any) {
    console.error("Transform error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to transform article" },
      { status: 500 }
    )
  }
}

// GET handler for bookmarklet redirect
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")
  if (!url) {
    return NextResponse.redirect(new URL("/", request.url))
  }
  // Redirect to the transform page which will call the API via client-side
  return NextResponse.redirect(new URL(`/transform?url=${encodeURIComponent(url)}`, request.url))
}
