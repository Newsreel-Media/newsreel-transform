"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import SlideViewer from "@/components/SlideViewer"

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'rgba(255, 99, 67, 0.2)',
          animation: 'embedPulse 1.5s ease-in-out infinite',
        }}
      />
      <p
        style={{
          fontFamily: 'monospace',
          fontSize: 12,
          color: '#666',
        }}
      >
        Loading story...
      </p>
      <style>{`
        @keyframes embedPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.95); }
        }
      `}</style>
    </div>
  )
}

function UnavailableMessage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 gap-3">
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <p
        style={{
          fontFamily: 'monospace',
          fontSize: 13,
          color: '#888',
          textAlign: 'center',
        }}
      >
        This interactive story is temporarily unavailable
      </p>
      <p
        style={{
          fontFamily: 'monospace',
          fontSize: 11,
          color: '#555',
          textAlign: 'center',
        }}
      >
        Please try again later
      </p>
    </div>
  )
}

function EmbedContent() {
  const searchParams = useSearchParams()
  const [story, setStory] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

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
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 60000)

      const fetchStory = async () => {
        try {
          const res = await fetch("/api/transform", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: articleUrl }),
            signal: controller.signal,
          })
          if (!res.ok) {
            setError(true)
          } else {
            const data = await res.json()
            if (data.story) {
              setStory(data.story)
            } else {
              setError(true)
            }
          }
        } catch {
          setError(true)
        } finally {
          clearTimeout(timeout)
          setLoading(false)
        }
      }
      fetchStory()

      return () => {
        window.removeEventListener("message", handleMessage)
        clearTimeout(timeout)
        controller.abort()
      }
    } else {
      // No URL param, just wait for postMessage
      setLoading(false)
    }

    return () => window.removeEventListener("message", handleMessage)
  }, [searchParams])

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return <UnavailableMessage />
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p style={{ fontFamily: 'monospace', fontSize: 13, color: '#666' }}>
          Waiting for story data...
        </p>
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
    <Suspense fallback={<LoadingSpinner />}>
      <EmbedContent />
    </Suspense>
  )
}
