'use client'

import { useState, useEffect } from 'react'
import SlideViewer from '@/components/SlideViewer'

// Fake article content that looks like a real news site
const ARTICLE = {
  publication: "The Oberlin Review",
  date: "March 16, 2026",
  section: "OPINIONS",
  headline: "Oberlin Students Crave the Rave: Steps We Should Take to Improve the Party Scene of Oberlin College",
  author: "Marcus Chen",
  authorTitle: "Contributing Writer",
  body: [
    "If you've been to an Oberlin party recently, you know the struggle. You hear about a house show at 10 p.m., walk 15 minutes in the cold, arrive to find it's already been shut down by Safety and Security, and end up back in your dorm watching Netflix by 11.",
    "This isn't a new problem. For years, Oberlin students have lamented the scattered, unreliable party scene that defines weekend social life at one of the nation's most progressive liberal arts colleges. But what if there was a better way?",
    "I'm proposing what I've dubbed the \"United Nations for Partying\" — a democratic committee of students from every corner of campus life who would coordinate, fund, and promote a unified social calendar. Think of it as student government, but for fun.",
    "The idea draws inspiration from rave culture in Miami and Berlin, where organizers have perfected the art of building community through music and shared experience. The key principles — PLUR (Peace, Love, Unity, Respect) — aren't so different from the values Oberlin already espouses.",
    "With only 2,886 undergraduates, Oberlin is small enough to actually pull this off. A single well-organized event each weekend could replace the current system of five competing house shows, three of which get shut down before midnight.",
    "The administration should embrace this, not fight it. Controlled, well-organized social events are safer than dozens of unregulated house parties scattered across town. It's harm reduction, which is something this campus supposedly believes in.",
    "The Student Senate has the budget. The co-ops have the spaces. The DJs and musicians — Oberlin is literally a conservatory — have the talent. All that's missing is coordination.",
    "I'm not saying we need to become a party school. I'm saying we need to stop pretending we don't want a social life, and start building one that actually works.",
  ],
}

export default function DemoPage() {
  const [story, setStory] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Auto-transform the Oberlin article
    fetch('/api/transform', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'https://oberlinreview.org/37345/opinions/oberlin-students-crave-the-rave-steps-we-should-take-to-improve-the-party-scene-of-oberlin-college/',
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.story) setStory(data.story)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      {/* Fake newspaper header */}
      <header style={{
        borderBottom: '3px solid #000',
        padding: '16px 0 12px',
        maxWidth: 720,
        margin: '0 auto',
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontFamily: '"Georgia", "Times New Roman", serif',
            fontSize: 32,
            fontWeight: 700,
            color: '#000',
            letterSpacing: '-0.5px',
          }}>
            The Oberlin Review
          </h1>
          <p style={{
            fontFamily: '"Georgia", serif',
            fontSize: 12,
            color: '#666',
            marginTop: 4,
          }}>
            Established 1874 &middot; The oldest continuously published college weekly in the United States
          </p>
        </div>
        <nav style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 24,
          marginTop: 12,
          paddingTop: 10,
          borderTop: '1px solid #ddd',
          fontFamily: '"Helvetica Neue", sans-serif',
          fontSize: 13,
          fontWeight: 500,
          color: '#333',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}>
          {['News', 'Opinions', 'Arts', 'Sports', 'Features'].map(s => (
            <span key={s} style={{ cursor: 'pointer', color: s === 'Opinions' ? '#c41e3a' : '#333' }}>{s}</span>
          ))}
        </nav>
      </header>

      {/* Article */}
      <article style={{ maxWidth: 680, margin: '0 auto', padding: '40px 20px 80px' }}>
        {/* Section tag */}
        <p style={{
          fontFamily: '"Helvetica Neue", sans-serif',
          fontSize: 12,
          fontWeight: 700,
          color: '#c41e3a',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          marginBottom: 16,
        }}>
          {ARTICLE.section}
        </p>

        {/* Headline */}
        <h1 style={{
          fontFamily: '"Georgia", "Times New Roman", serif',
          fontSize: 38,
          fontWeight: 700,
          lineHeight: 1.15,
          color: '#111',
          marginBottom: 16,
        }}>
          {ARTICLE.headline}
        </h1>

        {/* Byline */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 8,
          paddingBottom: 20,
          borderBottom: '1px solid #eee',
        }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #c41e3a, #e85d75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: 16,
          }}>
            MC
          </div>
          <div>
            <p style={{ fontFamily: '"Helvetica Neue", sans-serif', fontSize: 14, fontWeight: 600, color: '#111' }}>
              {ARTICLE.author}
            </p>
            <p style={{ fontFamily: '"Helvetica Neue", sans-serif', fontSize: 12, color: '#888' }}>
              {ARTICLE.authorTitle} &middot; {ARTICLE.date}
            </p>
          </div>
        </div>

        {/* Article body - first 3 paragraphs */}
        {ARTICLE.body.slice(0, 3).map((p, i) => (
          <p key={i} style={{
            fontFamily: '"Georgia", "Times New Roman", serif',
            fontSize: 18,
            lineHeight: 1.7,
            color: '#333',
            marginBottom: 24,
          }}>
            {p}
          </p>
        ))}

        {/* ====== NEWSREEL TRANSFORM EMBED ====== */}
        <div style={{
          margin: '40px -20px',
          padding: '24px 20px',
          background: '#f8f8f8',
          borderTop: '1px solid #eee',
          borderBottom: '1px solid #eee',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 16,
          }}>
            <div style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#FF6343',
            }} />
            <p style={{
              fontFamily: '"Helvetica Neue", sans-serif',
              fontSize: 11,
              fontWeight: 600,
              color: '#999',
              textTransform: 'uppercase',
              letterSpacing: '2px',
            }}>
              Interactive version powered by Newsreel
            </p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#999', fontSize: 14 }}>
              Loading interactive story...
            </div>
          ) : story ? (
            <div style={{ maxWidth: 393, margin: '0 auto' }}>
              <SlideViewer story={story} />
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#999', fontSize: 14 }}>
              Interactive story unavailable
            </div>
          )}
        </div>

        {/* Rest of article body */}
        {ARTICLE.body.slice(3).map((p, i) => (
          <p key={i + 3} style={{
            fontFamily: '"Georgia", "Times New Roman", serif',
            fontSize: 18,
            lineHeight: 1.7,
            color: '#333',
            marginBottom: 24,
          }}>
            {p}
          </p>
        ))}
      </article>

      {/* Footer */}
      <footer style={{
        borderTop: '2px solid #000',
        padding: '20px 0',
        textAlign: 'center',
        fontFamily: '"Helvetica Neue", sans-serif',
        fontSize: 12,
        color: '#888',
        maxWidth: 720,
        margin: '0 auto',
      }}>
        &copy; 2026 The Oberlin Review. All rights reserved.
      </footer>
    </div>
  )
}
