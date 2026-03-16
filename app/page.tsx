"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function Home() {
  const [url, setUrl] = useState("")
  const router = useRouter()

  const handleTransform = (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return
    router.push(`/transform?url=${encodeURIComponent(url.trim())}`)
  }

  const bookmarkletCode = `javascript:void(window.open('${typeof window !== "undefined" ? window.location.origin : "http://localhost:3006"}/transform?url='+encodeURIComponent(window.location.href),'_blank'))`

  return (
    <main className="min-h-screen bg-black">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-nr-red flex items-center justify-center font-heading text-white text-sm">
            N
          </div>
          <span className="font-heading text-white text-lg">Newsreel Transform</span>
        </div>
        <span className="text-xs font-mono text-nr-gray-400">MVP</span>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-24 pb-16 text-center">
        <p className="font-mono text-nr-red text-sm tracking-wider uppercase mb-4">
          Article to Story
        </p>
        <h1 className="font-heading text-4xl md:text-6xl text-white leading-tight mb-6">
          Turn any article into an interactive story
        </h1>
        <p className="text-nr-gray-400 text-lg max-w-xl mx-auto mb-12">
          Paste a URL and we will transform it into a swipeable, mobile-first
          Newsreel brief in seconds.
        </p>

        {/* URL Input */}
        <form onSubmit={handleTransform} className="flex gap-3 max-w-xl mx-auto mb-8">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/article..."
            className="flex-1 bg-nr-gray-900 border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-nr-gray-600 focus:outline-none focus:border-nr-red/50 focus:ring-1 focus:ring-nr-red/30 font-sans text-base transition-all"
            required
          />
          <button
            type="submit"
            className="bg-nr-red hover:bg-nr-red/90 text-white font-heading px-8 py-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
          >
            Transform
          </button>
        </form>

        {/* Bookmarklet */}
        <div className="bg-nr-gray-900 border border-white/10 rounded-2xl p-6 max-w-xl mx-auto">
          <p className="font-mono text-xs text-nr-gray-400 uppercase tracking-wider mb-3">
            Bookmarklet
          </p>
          <p className="text-nr-gray-400 text-sm mb-4">
            Drag this to your bookmarks bar to transform any article with one click:
          </p>
          <a
            href={bookmarkletCode}
            onClick={(e) => e.preventDefault()}
            draggable
            className="inline-flex items-center gap-2 bg-nr-yellow text-black font-heading px-6 py-3 rounded-xl cursor-grab active:cursor-grabbing hover:bg-nr-yellow/90 transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 1L10.5 6H14L11 9L12.5 14L8 11L3.5 14L5 9L2 6H5.5L8 1Z" fill="currentColor"/>
            </svg>
            Newsreel-ify
          </a>
          <p className="text-nr-gray-600 text-xs mt-3">
            Drag it - do not click it
          </p>
        </div>
      </section>

      {/* Example / How it works */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { step: "01", title: "Paste a URL", desc: "Drop in any news article link" },
            { step: "02", title: "AI transforms", desc: "Claude extracts and rewrites as slides" },
            { step: "03", title: "Swipe through", desc: "Interactive, mobile-first story" },
          ].map((item) => (
            <div key={item.step} className="bg-nr-gray-900 border border-white/10 rounded-2xl p-6">
              <span className="font-mono text-nr-red text-sm">{item.step}</span>
              <h3 className="font-heading text-white text-xl mt-2 mb-2">{item.title}</h3>
              <p className="text-nr-gray-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center">
        <p className="text-nr-gray-600 text-sm font-mono">
          Made by <span className="text-nr-red">Newsreel</span>
        </p>
      </footer>
    </main>
  )
}
