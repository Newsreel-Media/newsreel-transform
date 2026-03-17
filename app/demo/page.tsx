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

function LoadingSkeleton() {
  return (
    <div style={{ maxWidth: 393, margin: '0 auto' }}>
      {/* Phone-shaped skeleton */}
      <div style={{
        background: '#1a1a1a',
        borderRadius: 16,
        padding: 16,
        aspectRatio: '9/16',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        overflow: 'hidden',
      }}>
        {/* Top bar skeleton */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: '#333', animation: 'pulse 1.5s ease-in-out infinite',
          }} />
          <div style={{ flex: 1 }}>
            <div style={{
              width: '60%', height: 10, borderRadius: 4,
              background: '#333', animation: 'pulse 1.5s ease-in-out infinite',
              marginBottom: 6,
            }} />
            <div style={{
              width: '40%', height: 8, borderRadius: 4,
              background: '#2a2a2a', animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          </div>
        </div>
        {/* Image placeholder skeleton */}
        <div style={{
          width: '100%', height: '45%', borderRadius: 8,
          background: '#333', animation: 'pulse 1.5s ease-in-out infinite',
        }} />
        {/* Text line skeletons */}
        <div style={{
          width: '85%', height: 14, borderRadius: 4,
          background: '#333', animation: 'pulse 1.5s ease-in-out infinite',
        }} />
        <div style={{
          width: '95%', height: 14, borderRadius: 4,
          background: '#2a2a2a', animation: 'pulse 1.5s ease-in-out infinite',
        }} />
        <div style={{
          width: '70%', height: 14, borderRadius: 4,
          background: '#333', animation: 'pulse 1.5s ease-in-out infinite',
        }} />
        {/* Bottom dots skeleton */}
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'center', gap: 6 }}>
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: '50%',
              background: i === 0 ? '#555' : '#333',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          ))}
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

function ShareButtons() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginBottom: 20,
    }}>
      {/* Twitter/X */}
      <button
        type="button"
        aria-label="Share on Twitter"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 36, height: 36, borderRadius: '50%',
          border: '1px solid #ddd', background: '#fff', cursor: 'default',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#555">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      </button>
      {/* Facebook */}
      <button
        type="button"
        aria-label="Share on Facebook"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 36, height: 36, borderRadius: '50%',
          border: '1px solid #ddd', background: '#fff', cursor: 'default',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#555">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      </button>
      {/* Email */}
      <button
        type="button"
        aria-label="Share via Email"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 36, height: 36, borderRadius: '50%',
          border: '1px solid #ddd', background: '#fff', cursor: 'default',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2"/>
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
        </svg>
      </button>
    </div>
  )
}

export default function DemoPage() {
  const [story, setStory] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60000)

    fetch('/api/transform', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'https://oberlinreview.org/37345/opinions/oberlin-students-crave-the-rave-steps-we-should-take-to-improve-the-party-scene-of-oberlin-college/',
      }),
      signal: controller.signal,
    })
      .then(r => {
        if (!r.ok) throw new Error('Transform failed')
        return r.json()
      })
      .then(data => {
        if (data.story) {
          setStory(data.story)
        } else {
          setError(true)
        }
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [])

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      {/* Fake newspaper header */}
      <header style={{
        borderBottom: '3px solid #000',
        padding: '16px 20px 12px',
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
          flexWrap: 'wrap',
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
          fontSize: 'clamp(28px, 5vw, 38px)',
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
          marginBottom: 16,
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
            flexShrink: 0,
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

        {/* Social share buttons */}
        <ShareButtons />

        <div style={{ borderBottom: '1px solid #eee', marginBottom: 24 }} />

        {/* Hero image placeholder */}
        <figure style={{ margin: '0 0 32px 0' }}>
          <div style={{
            width: '100%',
            aspectRatio: '16/9',
            background: 'linear-gradient(135deg, #e8e8e8, #d0d0d0)',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
          <figcaption style={{
            fontFamily: '"Helvetica Neue", sans-serif',
            fontSize: 12,
            color: '#888',
            marginTop: 8,
            fontStyle: 'italic',
          }}>
            Image: Marcus Chen / The Oberlin Review
          </figcaption>
        </figure>

        {/* Article body - first 3 paragraphs */}
        {ARTICLE.body.slice(0, 3).map((p, i) => (
          <p key={i} style={{
            fontFamily: '"Georgia", "Times New Roman", serif',
            fontSize: 'clamp(16px, 2.5vw, 18px)',
            lineHeight: 1.7,
            color: '#333',
            marginBottom: 28,
          }}>
            {p}
          </p>
        ))}

        {/* ====== NEWSREEL TRANSFORM EMBED ====== */}
        <div style={{
          margin: '48px -20px',
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
            <a
              href="https://newsreel.co"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: '"Helvetica Neue", sans-serif',
                fontSize: 11,
                fontWeight: 600,
                color: '#999',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                textDecoration: 'none',
              }}
            >
              Interactive version powered by Newsreel
            </a>
          </div>

          {loading ? (
            <LoadingSkeleton />
          ) : story ? (
            <div style={{ maxWidth: 393, margin: '0 auto' }}>
              <SlideViewer story={story} />
            </div>
          ) : error ? (
            <div style={{
              textAlign: 'center',
              padding: '48px 20px',
              color: '#999',
              fontSize: 14,
              fontFamily: '"Helvetica Neue", sans-serif',
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: '#f0f0f0', margin: '0 auto 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <p style={{ marginBottom: 4, fontWeight: 500, color: '#666' }}>
                This interactive story is temporarily unavailable
              </p>
              <p style={{ fontSize: 12, color: '#aaa' }}>
                Please try refreshing the page
              </p>
            </div>
          ) : null}
        </div>

        {/* Rest of article body */}
        {ARTICLE.body.slice(3).map((p, i) => (
          <p key={i + 3} style={{
            fontFamily: '"Georgia", "Times New Roman", serif',
            fontSize: 'clamp(16px, 2.5vw, 18px)',
            lineHeight: 1.7,
            color: '#333',
            marginBottom: 28,
          }}>
            {p}
          </p>
        ))}
      </article>

      {/* Footer */}
      <footer style={{
        borderTop: '2px solid #000',
        padding: '20px',
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
