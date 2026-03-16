"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState, useRef, Suspense } from "react"
import SlideViewer from "@/components/SlideViewer"

function TransformContent() {
  const searchParams = useSearchParams()
  const url = searchParams.get("url")
  const [story, setStory] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const embedRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!url) {
      setError("No URL provided")
      setLoading(false)
      return
    }

    const transform = async () => {
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
      } catch (err: any) {
        setError(err.message || "Something went wrong")
      } finally {
        setLoading(false)
      }
    }

    transform()
  }, [url])

  const directLink = url
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/transform?url=${encodeURIComponent(url)}`
    : ""

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

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
        <div className="w-12 h-12 rounded-2xl bg-nr-red/20 flex items-center justify-center mb-6 animate-pulse-glow">
          <div className="w-6 h-6 rounded-lg bg-nr-red" />
        </div>
        <h2 className="font-heading text-xl text-white mb-2">Transforming your article...</h2>
        <p className="text-nr-gray-400 text-sm font-sans text-center max-w-sm">
          Fetching, extracting, and rewriting as an interactive story. This takes about 10 seconds.
        </p>
        {url && (
          <p className="mt-4 font-mono text-xs text-nr-gray-600 truncate max-w-xs">
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
        <p className="text-nr-gray-400 text-sm font-sans text-center max-w-sm mb-4">
          {error}
        </p>
        <p className="text-nr-gray-600 text-xs font-sans text-center max-w-sm mb-6">
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
          className="font-mono text-xs text-nr-gray-400 hover:text-white transition-colors"
        >
          New
        </a>
      </div>

      {/* Slide viewer */}
      <div className="flex-1 flex items-center justify-center py-4">
        <SlideViewer story={story} />
      </div>

      {/* Share this story section */}
      <div className="max-w-[393px] mx-auto w-full px-4 pb-8">
        <div className="bg-nr-gray-900 border border-white/10 rounded-2xl p-5">
          <h3 className="font-heading text-white text-lg mb-4">Share this story</h3>

          {/* Embed code */}
          <label className="block font-mono text-xs text-nr-gray-400 uppercase tracking-wider mb-2">
            Embed code
          </label>
          <div className="relative mb-4">
            <textarea
              ref={embedRef}
              readOnly
              value={embedCode}
              rows={3}
              className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-nr-gray-400 resize-none focus:outline-none focus:border-nr-red/50"
            />
            <button
              onClick={handleCopyEmbed}
              className="absolute top-2 right-2 font-mono text-[10px] bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded transition-all"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          {/* Direct link */}
          <label className="block font-mono text-xs text-nr-gray-400 uppercase tracking-wider mb-2">
            Direct link
          </label>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={directLink}
              className="flex-1 bg-black border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-nr-gray-400 focus:outline-none truncate"
            />
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(directLink)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
              className="font-mono text-[10px] bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded transition-all whitespace-nowrap"
            >
              Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TransformPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-nr-red/20 flex items-center justify-center animate-pulse-glow">
          <div className="w-6 h-6 rounded-lg bg-nr-red" />
        </div>
      </div>
    }>
      <TransformContent />
    </Suspense>
  )
}
