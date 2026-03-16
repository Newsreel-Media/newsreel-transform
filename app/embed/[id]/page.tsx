"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import SlideViewer from "@/components/SlideViewer"

function EmbedContent() {
  const searchParams = useSearchParams()
  const [story, setStory] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Option 1: Story data passed via postMessage from parent iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "newsreel-story") {
        setStory(event.data.story)
        setLoading(false)
      }
    }
    window.addEventListener("message", handleMessage)

    // Option 2: Story in URL hash (base64 encoded for small stories)
    const hash = window.location.hash.slice(1)
    if (hash) {
      try {
        const decoded = JSON.parse(atob(hash))
        setStory(decoded)
        setLoading(false)
        return () => window.removeEventListener("message", handleMessage)
      } catch {
        // not base64 encoded story, continue
      }
    }

    // Option 3: URL param to re-generate the story
    const articleUrl = searchParams.get("url")
    if (articleUrl) {
      const fetchStory = async () => {
        try {
          const res = await fetch("/api/transform", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: articleUrl }),
          })
          const data = await res.json()
          if (!res.ok) {
            setError(data.error || "Failed to transform")
          } else {
            setStory(data.story)
          }
        } catch (err: any) {
          setError(err.message || "Failed to load story")
        } finally {
          setLoading(false)
        }
      }
      fetchStory()
    } else {
      // No URL param, just wait for postMessage
      setLoading(false)
    }

    return () => window.removeEventListener("message", handleMessage)
  }, [searchParams])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 rounded-lg bg-nr-red/20 animate-pulse-glow" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <p className="text-nr-gray-400 font-mono text-sm text-center">{error}</p>
      </div>
    )
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-nr-gray-400 font-mono text-sm">Waiting for story data...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <SlideViewer story={story} />
    </div>
  )
}

export default function EmbedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 rounded-lg bg-nr-red/20 animate-pulse-glow" />
      </div>
    }>
      <EmbedContent />
    </Suspense>
  )
}
