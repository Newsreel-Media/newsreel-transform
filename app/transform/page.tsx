"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState, useRef, Suspense } from "react"
import Lottie from "lottie-react"
import StoryEditor from "@/components/StoryEditor"
import animationData from "@/public/animations/animation_clipped.json"

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60)
}

function TransformContent() {
  const searchParams = useSearchParams()
  const url = searchParams.get("url")
  const [story, setStory] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMessage, setLoadingMessage] = useState("Transforming your article...")
  const [copied, setCopied] = useState(false)
  const [showPublishForm, setShowPublishForm] = useState(false)
  const [published, setPublished] = useState(false)
  const [publishData, setPublishData] = useState({
    authorName: "",
    publicationName: "",
    email: "",
    sponsorEnabled: false,
    sponsorName: "",
    sponsorMessage: "",
    sponsorLink: "",
  })
  const embedRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!url) {
      setError("No URL provided")
      setLoading(false)
      return
    }

    const transform = async () => {
      // Progressive loading messages
      const timer5s = setTimeout(() => {
        setLoadingMessage("Still working...")
      }, 5000)
      const timer15s = setTimeout(() => {
        setLoadingMessage("This is taking longer than usual...")
      }, 15000)
      // Hard 45-second timeout so loading never gets stuck
      const timer45s = setTimeout(() => {
        setError("Transform timed out. Please try again or use a different article.")
        setLoading(false)
      }, 45000)

      try {
        const res = await fetch("/api/transform", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data.error || "Failed to transform article")
          return
        }

        setStory(data.story)
        // Pre-fill publish form from story data
        setPublishData((prev) => ({
          ...prev,
          publicationName: data.story.source_name || "",
        }))
      } catch (err: any) {
        setError(err.message || "Something went wrong")
      } finally {
        clearTimeout(timer5s)
        clearTimeout(timer15s)
        clearTimeout(timer45s)
        setLoading(false)
      }
    }

    transform()
  }, [url])

  const storySlug = story ? slugify(story.story_headline || "story") : "story"

  const embedCode = url
    ? `<iframe src="${typeof window !== "undefined" ? window.location.origin : "https://transform.newsreel.co"}/embed/story?url=${encodeURIComponent(url)}" width="400" height="700" frameborder="0"></iframe>`
    : ""

  const handleCopyEmbed = async () => {
    try {
      await navigator.clipboard.writeText(embedCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      if (embedRef.current) {
        embedRef.current.select()
        document.execCommand("copy")
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    }
  }

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault()
    // Send submission to our API (stores for review)
    try {
      await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: publishData.authorName,
          publication: publishData.publicationName,
          email: publishData.email,
          source_url: url,
          story,
          sponsor: publishData.sponsorEnabled ? { name: publishData.sponsorName, message: publishData.sponsorMessage, link: publishData.sponsorLink } : null,
          submitted_at: new Date().toISOString(),
        }),
      })
    } catch {
      // Non-blocking — still show success even if submit fails
    }
    setPublished(true)
    setShowPublishForm(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
        <div className="w-60 h-60 mb-6 mt-20">
          <Lottie animationData={animationData} loop autoplay />
        </div>
        <h2 className="font-heading text-xl text-white mb-2">{loadingMessage}</h2>
        <p className="text-nr-ash text-sm font-sans text-center max-w-sm">
          Fetching, extracting, and rewriting as an interactive story. This takes about 10 seconds.
        </p>
        {url && (
          <p className="mt-4 font-mono text-xs text-nr-steel truncate max-w-xs">
            {url}
          </p>
        )}
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
        <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center mb-6">
          <span className="text-red-500 text-xl">!</span>
        </div>
        <h2 className="font-heading text-xl text-white mb-2">Transform failed</h2>
        <p className="text-nr-ash text-sm font-sans text-center max-w-sm mb-4">
          {error}
        </p>
        <p className="text-nr-steel text-xs font-sans text-center max-w-sm mb-6">
          Some sites block external access. Try BBC, NPR, Wikipedia, or your own articles.
        </p>
        <a
          href="/"
          className="bg-nr-red hover:bg-nr-red/90 text-white font-heading px-6 py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          Try another article
        </a>
      </div>
    )
  }

  if (!story) return null

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <a href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-nr-red flex items-center justify-center font-heading text-white text-xs">
            N
          </div>
          <span className="font-heading text-white text-sm">Transform</span>
        </a>
        <a
          href="/"
          className="font-mono text-xs text-nr-ash hover:text-white transition-colors"
        >
          New
        </a>
      </div>

      {/* Story editor */}
      <div className="flex-1 flex items-center justify-center py-4">
        <StoryEditor
          story={story}
          onStoryChange={(updated) => setStory(updated)}
          sponsorSlide={
            publishData.sponsorEnabled && publishData.sponsorName
              ? {
                  name: publishData.sponsorName,
                  message: publishData.sponsorMessage,
                  link: publishData.sponsorLink,
                }
              : undefined
          }
        />
      </div>

      {/* Publish section */}
      <div className="max-w-[393px] mx-auto w-full px-4 pb-8">
        {published ? (
          /* ─── Success State ─── */
          <div className="bg-nr-charcoal border border-green-500/30 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M5 10L9 14L15 6" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <h3 className="font-heading text-white text-lg">Submitted to Newsreel!</h3>
                <p className="font-sans text-white/50 text-xs">We'll review and publish your story within 24 hours. You'll reach 4,000+ daily readers.</p>
              </div>
            </div>

            {/* Fake Newsreel URL */}
            <div className="bg-black border border-white/10 rounded-lg px-4 py-3 mb-4">
              <p className="font-mono text-[10px] text-nr-ash uppercase tracking-wider mb-1">Story URL</p>
              <p className="font-mono text-sm text-nr-red">
                newsreel.co/stories/{storySlug}
              </p>
            </div>

            {/* Embed code (secondary) */}
            <div className="mb-3">
              <label className="block font-mono text-[10px] text-nr-ash uppercase tracking-wider mb-2">
                Embed on your site
              </label>
              <div className="relative">
                <textarea
                  ref={embedRef}
                  readOnly
                  value={embedCode}
                  rows={3}
                  className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-nr-ash resize-none focus:outline-none focus:border-nr-red/50"
                />
                <button
                  onClick={handleCopyEmbed}
                  className="absolute top-2 right-2 font-mono text-[10px] bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded transition-all"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            <a
              href="/"
              className="block text-center font-mono text-xs text-nr-ash hover:text-white transition-colors mt-3"
            >
              Transform another article
            </a>
          </div>
        ) : showPublishForm ? (
          /* ─── Publish Form ─── */
          <div className="bg-nr-charcoal border border-white/10 rounded-2xl p-5">
            <h3 className="font-heading text-white text-lg mb-1">Publish to Newsreel</h3>
            <p className="font-sans text-white/60 text-xs mb-5">Free. We'll review and publish your story within 24 hours.</p>

            <form onSubmit={handlePublish} className="space-y-4">
              <div>
                <label className="block font-mono text-[10px] text-nr-ash uppercase tracking-wider mb-1.5">
                  Author name
                </label>
                <input
                  type="text"
                  value={publishData.authorName}
                  onChange={(e) => setPublishData((p) => ({ ...p, authorName: e.target.value }))}
                  placeholder="Your name"
                  className="w-full bg-black border border-white/10 rounded-lg px-3 py-2.5 text-sm font-sans text-white placeholder:text-nr-steel focus:outline-none focus:border-nr-red/50"
                  required
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] text-nr-ash uppercase tracking-wider mb-1.5">
                  Publication
                </label>
                <input
                  type="text"
                  value={publishData.publicationName}
                  onChange={(e) => setPublishData((p) => ({ ...p, publicationName: e.target.value }))}
                  placeholder="Your publication"
                  className="w-full bg-black border border-white/10 rounded-lg px-3 py-2.5 text-sm font-sans text-white placeholder:text-nr-steel focus:outline-none focus:border-nr-red/50"
                  required
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] text-nr-ash uppercase tracking-wider mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={publishData.email}
                  onChange={(e) => setPublishData((p) => ({ ...p, email: e.target.value }))}
                  placeholder="you@publication.com"
                  className="w-full bg-black border border-white/10 rounded-lg px-3 py-2.5 text-sm font-sans text-white placeholder:text-nr-steel focus:outline-none focus:border-nr-red/50"
                  required
                />
              </div>

              {/* Sponsor toggle */}
              <div className="border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={() => setPublishData((p) => ({ ...p, sponsorEnabled: !p.sponsorEnabled }))}
                  className="flex items-center gap-3 w-full"
                >
                  <div
                    className={`w-10 h-6 rounded-full transition-all flex items-center px-0.5 ${
                      publishData.sponsorEnabled ? "bg-nr-red" : "bg-white/10"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        publishData.sponsorEnabled ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </div>
                  <div className="text-left">
                    <p className="font-sans text-white text-sm">Add a sponsored slide</p>
                    <p className="font-mono text-[10px] text-nr-ash">Promote a brand within your story</p>
                  </div>
                </button>
              </div>

              {publishData.sponsorEnabled && (
                <div className="space-y-3 pl-1 border-l-2 border-nr-red/30 ml-1">
                  <div>
                    <label className="block font-mono text-[10px] text-nr-ash uppercase tracking-wider mb-1.5">
                      Sponsor name
                    </label>
                    <input
                      type="text"
                      value={publishData.sponsorName}
                      onChange={(e) => setPublishData((p) => ({ ...p, sponsorName: e.target.value }))}
                      placeholder="Acme Inc."
                      className="w-full bg-black border border-white/10 rounded-lg px-3 py-2.5 text-sm font-sans text-white placeholder:text-nr-steel focus:outline-none focus:border-nr-red/50"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] text-nr-ash uppercase tracking-wider mb-1.5">
                      Message
                    </label>
                    <input
                      type="text"
                      value={publishData.sponsorMessage}
                      onChange={(e) => setPublishData((p) => ({ ...p, sponsorMessage: e.target.value }))}
                      placeholder="One line about the sponsor"
                      className="w-full bg-black border border-white/10 rounded-lg px-3 py-2.5 text-sm font-sans text-white placeholder:text-nr-steel focus:outline-none focus:border-nr-red/50"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] text-nr-ash uppercase tracking-wider mb-1.5">
                      Link URL
                    </label>
                    <input
                      type="url"
                      value={publishData.sponsorLink}
                      onChange={(e) => setPublishData((p) => ({ ...p, sponsorLink: e.target.value }))}
                      placeholder="https://sponsor.com"
                      className="w-full bg-black border border-white/10 rounded-lg px-3 py-2.5 text-sm font-sans text-white placeholder:text-nr-steel focus:outline-none focus:border-nr-red/50"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-nr-red hover:bg-nr-red/90 text-white font-heading py-3.5 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] text-base"
              >
                Publish
              </button>

              <button
                type="button"
                onClick={() => setShowPublishForm(false)}
                className="w-full font-mono text-xs text-nr-ash hover:text-white transition-colors py-2"
              >
                Back
              </button>
            </form>
          </div>
        ) : (
          /* ─── Default: Publish CTA ─── */
          <div className="space-y-3">
            <button
              onClick={() => setShowPublishForm(true)}
              className="w-full bg-nr-red hover:bg-nr-red/90 text-white font-heading py-4 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] text-lg flex items-center justify-center gap-2"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 16L16 9L2 2V7.5L11 9L2 10.5V16Z" fill="currentColor" />
              </svg>
              Publish to Newsreel
            </button>
            <p className="text-center font-sans text-white/60 text-xs">
              Free. Your story reaches 4,000+ daily readers on Newsreel.
            </p>

            {/* Embed code (collapsed secondary) */}
            <details className="group">
              <summary className="cursor-pointer font-mono text-[10px] text-nr-ash uppercase tracking-wider hover:text-white transition-colors text-center py-2">
                Embed on your site
              </summary>
              <div className="mt-2 bg-nr-charcoal border border-white/10 rounded-2xl p-4">
                <div className="relative">
                  <textarea
                    ref={embedRef}
                    readOnly
                    value={embedCode}
                    rows={3}
                    className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-nr-ash resize-none focus:outline-none focus:border-nr-red/50"
                  />
                  <button
                    onClick={handleCopyEmbed}
                    className="absolute top-2 right-2 font-mono text-[10px] bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded transition-all"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  )
}

export default function TransformPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12">
          <Lottie animationData={animationData} loop autoplay />
        </div>
      </div>
    }>
      <TransformContent />
    </Suspense>
  )
}
