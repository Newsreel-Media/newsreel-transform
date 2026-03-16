"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import SlideViewer from "@/components/SlideViewer"

function EmbedContent() {
  const searchParams = useSearchParams()
  const [story, setStory] = useState<any>(null)

  useEffect(() => {
    // Story data can be passed via postMessage from parent iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "newsreel-story") {
        setStory(event.data.story)
      }
    }
    window.addEventListener("message", handleMessage)

    // Also check for story in URL hash (base64 encoded for small stories)
    const hash = window.location.hash.slice(1)
    if (hash) {
      try {
        const decoded = JSON.parse(atob(hash))
        setStory(decoded)
      } catch {
        // ignore
      }
    }

    return () => window.removeEventListener("message", handleMessage)
  }, [searchParams])

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
