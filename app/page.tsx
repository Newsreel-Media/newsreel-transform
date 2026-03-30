"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

const EXAMPLE_URLS = [
  {
    label: "Oberlin Review",
    url: "https://oberlinreview.org/37345/opinions/oberlin-students-crave-the-rave-steps-we-should-take-to-improve-the-party-scene-of-oberlin-college/",
  },
  {
    label: "BBC News",
    url: "https://www.bbc.com/news/technology",
  },
  {
    label: "Wikipedia",
    url: "https://en.wikipedia.org/wiki/Generative_artificial_intelligence",
  },
]

export default function Home() {
  const [url, setUrl] = useState("")
  const router = useRouter()

  const handleTransform = (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return
    router.push(`/transform?url=${encodeURIComponent(url.trim())}`)
  }

  return (
    <main className="min-h-screen bg-black">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Image
            src="/assets/white.png"
            alt="Newsreel"
            width={140}
            height={28}
            className="h-7 w-auto"
          />
          <span className="font-heading text-white text-lg">Transform</span>
        </div>
        <span className="text-xs font-mono text-nr-ash">Beta</span>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-24 pb-16 text-center">
        <p className="font-mono text-nr-red text-sm tracking-wider uppercase mb-4">
          Paste a link. Get an interactive story.
        </p>
        <h1 className="font-heading text-4xl md:text-6xl text-white leading-tight mb-6">
          Turn any article into something people actually swipe through
        </h1>
        <p className="text-nr-ash text-lg max-w-xl mx-auto mb-12">
          Drop in a URL. We turn it into interactive slides with photos, quizzes, polls, and animated stats. Free. Takes 30 seconds.
        </p>

        {/* URL Input - stacks on mobile */}
        <form onSubmit={handleTransform} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mb-6">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/article..."
            className="flex-1 bg-nr-charcoal border border-white/10 rounded-xl px-5 py-4 text-white placeholder:text-nr-steel focus:outline-none focus:border-nr-red/50 focus:ring-1 focus:ring-nr-red/30 font-sans text-base transition-all"
            required
          />
          <button
            type="submit"
            className="bg-nr-red hover:bg-nr-red/90 text-white font-heading px-8 py-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
          >
            Transform
          </button>
        </form>

        {/* Example URLs */}
        <div className="flex flex-wrap items-center justify-center gap-3 max-w-xl mx-auto mb-10">
          {EXAMPLE_URLS.map((example) => (
            <button
              key={example.label}
              onClick={() => {
                setUrl(example.url)
                router.push(`/transform?url=${encodeURIComponent(example.url)}`)
              }}
              className="font-mono text-xs text-nr-ash hover:text-nr-red border border-white/10 hover:border-nr-red/30 rounded-full px-4 py-2 transition-all"
            >
              Try: {example.label}
            </button>
          ))}
        </div>

        {/* Value prop */}
        <div className="max-w-xl mx-auto text-center">
          <p className="text-nr-ash text-sm leading-relaxed">
            Your words. Your reporting. Just a format readers actually finish. No paywall, no account needed, no cost.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <h2 className="font-heading text-2xl text-white text-center mb-8">How it works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { step: "01", title: "Paste any URL", desc: "Any article from any site. News, opinion, features, research -- it all works." },
            { step: "02", title: "Watch it become interactive", desc: "Your article gets rebuilt as swipeable slides with photos, quizzes, and animated stats. Same story, totally new format." },
            { step: "03", title: "Share it or embed it", desc: "Your interactive story gets a shareable link instantly. Embed it on your own site or publish it to the Newsreel platform to reach new readers." },
          ].map((item) => (
            <div key={item.step} className="bg-nr-charcoal border border-white/10 rounded-2xl p-6">
              <span className="font-mono text-nr-red text-sm">{item.step}</span>
              <h3 className="font-heading text-white text-xl mt-2 mb-2">{item.title}</h3>
              <p className="text-nr-ash text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center">
        <p className="text-nr-steel text-sm font-mono flex items-center justify-center gap-2">
          Made by <Image
            src="/assets/white.png"
            alt="Newsreel"
            width={80}
            height={16}
            className="h-4 w-auto"
          />
        </p>
      </footer>
    </main>
  )
}
