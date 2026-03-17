"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"

const AuthorVideoRecorder = dynamic(
  () => import("./AuthorVideoRecorder").then(m => ({ default: m.AuthorVideoRecorder })),
  { ssr: false }
)

// ─── Types ───────────────────────────────────────────────────────────
interface Slide {
  subheadline: string
  content: string
  image_query?: string
}

interface Quiz {
  question: string
  answers: { a: string; b: string; c: string; d: string }
  correct_answer: string
}

interface Guess {
  question: string
  options: string[]
}

interface QuickPoll {
  question: string
  option_a: string
  option_b: string
}

interface Story {
  story_headline: string
  subhead: string
  source_name?: string
  source_url?: string
  slides: Slide[]
  quiz?: Quiz
  guess?: Guess
  quick_poll?: QuickPoll
}

interface StatOverlay {
  value: string
  label: string
  source: string
}

type EditMode = null | "photo" | "text" | "record" | "chart"

// ─── Constants ───────────────────────────────────────────────────────
const GRADIENTS = [
  "linear-gradient(160deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
  "linear-gradient(135deg, #0f0f0f 0%, #2d1b2e 50%, #1a0a1e 100%)",
  "linear-gradient(150deg, #000000 0%, #1a2a1a 50%, #0f1f0f 100%)",
  "linear-gradient(140deg, #0a0a0a 0%, #2a1a0a 50%, #1f1a0f 100%)",
  "linear-gradient(160deg, #0f0f0f 0%, #0a1a2a 50%, #1a2a3a 100%)",
  "linear-gradient(135deg, #000000 0%, #1f0f1f 50%, #2a1a2a 100%)",
]

function getIcon(subheadline: string): string {
  const lower = subheadline.toLowerCase()
  if (lower.includes("hook")) return "\uD83C\uDFA3"
  if (lower.includes("zoom in")) return "\uD83D\uDD0D"
  if (lower.includes("zoom out")) return "\uD83C\uDF0E"
  if (lower.includes("rewind")) return "\u23EA"
  if (lower.includes("numbers")) return "\uD83D\uDCCA"
  if (lower.includes("watch")) return "\uD83D\uDC40"
  if (lower.includes("counterpoint")) return "\uD83D\uDD04"
  if (lower.includes("yes, but")) return "\uD83D\uDC47"
  if (lower.includes("food for thought")) return "\uD83C\uDF4E"
  if (lower.includes("tangent")) return "\uD83C\uDF00"
  if (lower.includes("content warning")) return "\u26A0\uFE0F"
  return "\uD83D\uDCF0"
}

// ─── Animated Number Counter ─────────────────────────────────────────
function AnimatedNumber({ value, suffix, prefix, active }: { value: number; suffix: string; prefix: string; active: boolean }) {
  const [display, setDisplay] = useState(0)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!active || hasAnimated.current) return
    hasAnimated.current = true
    const duration = 1500
    const startTime = performance.now()
    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(value * eased))
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    requestAnimationFrame(animate)
  }, [active, value])

  return (
    <span className="font-heading text-4xl text-white">
      {prefix}{display.toLocaleString()}{suffix}
    </span>
  )
}

// ─── Parse stat numbers from slide content ──────────────────────────
function parseStatNumber(content: string): { value: number; prefix: string; suffix: string; full: string } | null {
  const match = content.match(/(\$?)([\d,]+(?:\.\d+)?)\s*(%)?\s*(million|billion|trillion|thousand)?/i)
  if (!match) return null
  const prefix = match[1] || ""
  const numStr = match[2].replace(/,/g, "")
  const value = parseFloat(numStr)
  if (isNaN(value)) return null
  let suffix = ""
  if (match[3]) suffix = "%"
  if (match[4]) suffix = " " + match[4].toLowerCase()
  return { value, prefix, suffix, full: match[0] }
}

// ─── Photo Search Overlay ────────────────────────────────────────────
function PhotoSearchOverlay({
  defaultQuery,
  onSelect,
  onClose,
}: {
  defaultQuery: string
  onSelect: (url: string) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState(defaultQuery)
  const [results, setResults] = useState<Array<{ url: string; thumbnail: string }>>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const search = async () => {
    if (!query.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/photos?q=${encodeURIComponent(query)}&type=photo&count=8`)
      const data = await res.json()
      setResults(data.results || [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      e.stopPropagation()
      search()
    }
    if (e.key === "Escape") {
      onClose()
    }
    // Stop keyboard nav from firing
    e.stopPropagation()
  }

  return (
    <>
      {/* Mobile: full-screen fixed modal */}
      <div
        className="sm:hidden fixed inset-0 z-50 bg-black/95 flex flex-col"
        style={{ height: "100dvh", paddingBottom: "env(safe-area-inset-bottom)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with search input */}
        <div className="flex items-center gap-2 p-3 pt-[max(12px,env(safe-area-inset-top))] border-b border-white/10 bg-black">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search photos..."
            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/40"
          />
          <button
            onClick={search}
            className="px-3 py-2.5 bg-nr-red rounded-lg text-white text-sm font-mono hover:bg-nr-red/80 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            {loading ? (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )}
          </button>
          <button
            onClick={onClose}
            className="px-2 py-2.5 text-white/50 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
              <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Results grid - scrollable area fills remaining space */}
        <div className="flex-1 overflow-y-auto p-3">
          {results.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {results.map((r, i) => (
                <button
                  key={i}
                  onClick={() => onSelect(r.url)}
                  className="aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-nr-red transition-all"
                >
                  <img
                    src={r.thumbnail}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}

          {results.length === 0 && !loading && query && (
            <p className="text-white/60 text-xs font-mono text-center py-8">
              Hit enter or tap search to find photos
            </p>
          )}
        </div>
      </div>

      {/* Desktop (sm+): inline overlay at top of slide */}
      <div className="hidden sm:block absolute inset-x-0 top-0 z-50 p-3" onClick={(e) => e.stopPropagation()}>
        <div className="glass-card rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search photos..."
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/40"
            />
            <button
              onClick={search}
              className="px-3 py-2 bg-nr-red rounded-lg text-white text-sm font-mono hover:bg-nr-red/80 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              {loading ? (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-2 py-2 text-white/50 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {results.length > 0 && (
            <div className="grid grid-cols-4 gap-1.5 max-h-[160px] overflow-y-auto">
              {results.map((r, i) => (
                <button
                  key={i}
                  onClick={() => onSelect(r.url)}
                  className="aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-nr-red transition-all"
                >
                  <img
                    src={r.thumbnail}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}

          {results.length === 0 && !loading && query && (
            <p className="text-white/60 text-xs font-mono text-center py-2">
              Hit enter or tap search to find photos
            </p>
          )}
        </div>
      </div>
    </>
  )
}

// ─── Stat Card Overlay ──────────────────────────────────────────────
function StatCard({ stat }: { stat: StatOverlay }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
      <div className="glass-card rounded-2xl p-6 text-center max-w-[280px] pointer-events-auto">
        <p className="font-heading text-4xl text-white mb-2">{stat.value}</p>
        <p className="font-sans text-white/80 text-sm leading-relaxed mb-2">{stat.label}</p>
        <p className="font-mono text-[10px] text-white/60 uppercase tracking-wider">{stat.source}</p>
      </div>
    </div>
  )
}

// ─── Add Chart Modal ────────────────────────────────────────────────
function AddChartModal({
  onAdd,
  onClose,
}: {
  onAdd: (stat: StatOverlay) => void
  onClose: () => void
}) {
  const [value, setValue] = useState("")
  const [label, setLabel] = useState("")
  const [source, setSource] = useState("")

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation()
    if (e.key === "Escape") onClose()
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card rounded-2xl p-5 w-[300px] mx-4" onClick={(e) => e.stopPropagation()}>
        <p className="font-mono text-nr-red text-xs uppercase tracking-wider mb-4">Add stat card</p>

        <div className="space-y-3">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Stat value (e.g. "47%")'
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/40"
            autoFocus
          />
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Label (e.g. "of Gen Z gets news from TikTok")'
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/40"
          />
          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Source (e.g. "Pew Research, 2025")'
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/40"
          />
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-white/10 text-white/50 text-sm font-mono hover:border-white/30 transition-colors min-h-[44px]"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (value.trim()) {
                onAdd({ value: value.trim(), label: label.trim(), source: source.trim() })
              }
            }}
            disabled={!value.trim()}
            className="flex-1 py-2.5 rounded-lg bg-nr-red text-white text-sm font-mono hover:bg-nr-red/80 transition-colors disabled:opacity-30 min-h-[44px]"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Edit Toolbar ───────────────────────────────────────────────────
function EditToolbar({
  editMode,
  onSetMode,
  onDone,
  onRecord,
  keyboardOpen,
}: {
  editMode: EditMode
  onSetMode: (mode: EditMode) => void
  onDone: () => void
  onRecord: () => void
  keyboardOpen: boolean
}) {
  // Hide toolbar when keyboard is open (it would be behind the keyboard anyway)
  if (keyboardOpen) return null

  const buttons: Array<{ mode: EditMode; label: string; icon: React.ReactNode }> = [
    {
      mode: "photo",
      label: "Photo",
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="2" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="6.5" cy="7.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M2 12L6 9L9 11L12 8L16 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      mode: "text",
      label: "Text",
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M3 4H15M9 4V15M6 15H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      mode: "record",
      label: "Record",
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3 16C3 13.2386 5.68629 11 9 11C12.3137 11 15 13.2386 15 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      mode: "chart",
      label: "Chart",
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="2" y="10" width="3" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
          <rect x="7.5" y="6" width="3" height="10" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
          <rect x="13" y="2" width="3" height="14" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      ),
    },
  ]

  return (
    <div className="absolute bottom-[48px] left-0 right-0 z-30">
      <div className="flex items-center justify-center gap-1 px-3 py-2 bg-black/80 backdrop-blur-md border-t border-white/10">
        {buttons.map((btn) => (
          <div key={btn.label} className="relative">
            <button
              onClick={() => {
                if (btn.mode === "record") {
                  onRecord()
                  return
                }
                onSetMode(editMode === btn.mode ? null : btn.mode)
              }}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all min-w-[48px] min-h-[44px] justify-center ${
                editMode === btn.mode
                  ? "bg-nr-red/20 text-nr-red"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              {btn.icon}
              <span className="font-mono text-[9px] tracking-wider">{btn.label}</span>
            </button>
            {/* Record button opens the recorder modal */}
          </div>
        ))}

        <div className="w-px h-8 bg-white/10 mx-1" />

        <button
          onClick={onDone}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-green-400 hover:text-green-300 transition-all min-w-[48px] min-h-[44px] justify-center"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M4 9L7.5 12.5L14 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-mono text-[9px] tracking-wider">Done</span>
        </button>
      </div>
    </div>
  )
}

// ─── Editable Text ──────────────────────────────────────────────────
function EditableText({
  value,
  onChange,
  editable,
  className,
  tag: Tag = "p",
}: {
  value: string
  onChange: (v: string) => void
  editable: boolean
  className?: string
  tag?: "p" | "h1" | "span"
}) {
  const ref = useRef<HTMLElement>(null)

  const handleBlur = () => {
    if (ref.current) {
      const newText = ref.current.innerText.trim()
      if (newText !== value) {
        onChange(newText)
      }
    }
  }

  // Sync value when it changes externally
  useEffect(() => {
    if (ref.current && ref.current.innerText.trim() !== value) {
      ref.current.innerText = value
    }
  }, [value])

  const editableProps = editable
    ? {
        contentEditable: true as const,
        suppressContentEditableWarning: true as const,
        onBlur: handleBlur,
        onKeyDown: (e: React.KeyboardEvent) => {
          // Prevent slide nav while editing
          e.stopPropagation()
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            ;(e.target as HTMLElement).blur()
          }
        },
        style: {
          outline: "none",
          cursor: "text" as const,
          borderBottom: "1px dashed rgba(255,255,255,0.2)",
          borderRadius: 2,
          paddingBottom: 1,
        },
      }
    : {}

  return (
    <Tag
      ref={ref as any}
      className={className}
      {...editableProps}
    >
      {value}
    </Tag>
  )
}

// ─── Sponsor Slide Type ─────────────────────────────────────────────
interface SponsorSlide {
  name: string
  message: string
  link: string
}

// ─── Main StoryEditor ───────────────────────────────────────────────
export default function StoryEditor({
  story: initialStory,
  onStoryChange,
  sponsorSlide,
}: {
  story: Story
  onStoryChange?: (story: Story) => void
  sponsorSlide?: SponsorSlide
}) {
  const [story, setStory] = useState<Story>(initialStory)
  const [editMode, setEditMode] = useState<EditMode>(null)
  const [showToolbar, setShowToolbar] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null)
  const [guessAnswer, setGuessAnswer] = useState<string | null>(null)
  const [pollAnswer, setPollAnswer] = useState<string | null>(null)
  const [pollPercent] = useState(() => Math.floor(Math.random() * 16) + 55)
  const [slidePhotos, setSlidePhotos] = useState<Record<number, string>>({})
  const [photoSearchSlide, setPhotoSearchSlide] = useState<number | null>(null)
  const [showChartModal, setShowChartModal] = useState(false)
  const [showRecorder, setShowRecorder] = useState(false)
  const [slideStats, setSlideStats] = useState<Record<number, StatOverlay>>({})
  const [keyboardOpen, setKeyboardOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  // Detect keyboard open via visualViewport API
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const handler = () => {
      setKeyboardOpen(vv.height < window.innerHeight * 0.75)
    }
    vv.addEventListener("resize", handler)
    return () => vv.removeEventListener("resize", handler)
  }, [])

  // Propagate story changes
  const updateStory = useCallback(
    (updater: (prev: Story) => Story) => {
      setStory((prev) => {
        const next = updater(prev)
        onStoryChange?.(next)
        return next
      })
    },
    [onStoryChange]
  )

  // Fetch photos sequentially to avoid duplicate photos across slides
  useEffect(() => {
    const fetchPhotosSequentially = async () => {
      const usedUrls = new Set<string>()
      for (let i = 0; i < story.slides.length; i++) {
        const slide = story.slides[i]
        if (!slide.image_query) continue
        const type = i % 3 === 1 ? "gif" : "photo"
        try {
          const res = await fetch(`/api/photos?q=${encodeURIComponent(slide.image_query)}&type=${type}&count=3`)
          const data = await res.json()
          const results: Array<{ url?: string }> = data.results || (data.url ? [data] : [])
          const unused = results.find((r) => r.url && !usedUrls.has(r.url))
          if (unused?.url) {
            usedUrls.add(unused.url)
            setSlidePhotos((prev) => ({ ...prev, [i]: unused.url! }))
          } else if (results[0]?.url) {
            usedUrls.add(results[0].url)
            setSlidePhotos((prev) => ({ ...prev, [i]: results[0].url! }))
          }
        } catch {
          if (type === "gif" && slide.image_query) {
            try {
              const res = await fetch(`/api/photos?q=${encodeURIComponent(slide.image_query)}&type=photo&count=3`)
              const data = await res.json()
              const results: Array<{ url?: string }> = data.results || (data.url ? [data] : [])
              const unused = results.find((r) => r.url && !usedUrls.has(r.url))
              if (unused?.url) {
                usedUrls.add(unused.url)
                setSlidePhotos((prev) => ({ ...prev, [i]: unused.url! }))
              } else if (results[0]?.url) {
                usedUrls.add(results[0].url)
                setSlidePhotos((prev) => ({ ...prev, [i]: results[0].url! }))
              }
            } catch {}
          }
        }
      }
    }
    fetchPhotosSequentially()
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Error state: no slides
  if (!story.slides || story.slides.length === 0) {
    return (
      <div className="w-[393px] h-[700px] bg-black rounded-[2rem] flex flex-col items-center justify-center px-6">
        <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center mb-6">
          <span className="text-red-500 text-xl">!</span>
        </div>
        <h2 className="font-heading text-xl text-white mb-2">No slides generated</h2>
        <p className="text-white/50 text-sm font-sans text-center">
          The story could not be created. Try a different article.
        </p>
      </div>
    )
  }

  // Page list
  const pages: Array<{ type: "headline" | "slide" | "guess" | "quiz" | "quick_poll" | "completion" | "sponsored"; index?: number }> = []
  // Headline card is always first
  pages.push({ type: "headline" })
  if (story.guess) pages.push({ type: "guess" })
  story.slides.forEach((_, i) => {
    pages.push({ type: "slide", index: i })
    // Insert quick_poll after the second slide (index 1)
    if (i === 1 && story.quick_poll) {
      pages.push({ type: "quick_poll" })
    }
    // Insert sponsored slide after the third content slide (index 2)
    if (i === 2 && sponsorSlide) {
      pages.push({ type: "sponsored" })
    }
  })
  if (story.quiz) pages.push({ type: "quiz" })
  // Always add completion slide at the end
  pages.push({ type: "completion" })
  const totalPages = pages.length

  const scrollToSlide = useCallback((index: number) => {
    if (scrollRef.current) {
      const slideWidth = scrollRef.current.offsetWidth
      scrollRef.current.scrollTo({ left: slideWidth * index, behavior: "smooth" })
    }
  }, [])

  const goNext = useCallback(() => {
    if (currentSlide < totalPages - 1) scrollToSlide(currentSlide + 1)
  }, [currentSlide, totalPages, scrollToSlide])

  const goPrev = useCallback(() => {
    if (currentSlide > 0) scrollToSlide(currentSlide - 1)
  }, [currentSlide, scrollToSlide])

  // Scroll listener
  useEffect(() => {
    const container = scrollRef.current
    if (!container) return
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const slideWidth = container.offsetWidth
          const newSlide = Math.round(container.scrollLeft / slideWidth)
          setCurrentSlide(newSlide)
          ticking = false
        })
        ticking = true
      }
    }
    container.addEventListener("scroll", handleScroll, { passive: true })
    return () => container.removeEventListener("scroll", handleScroll)
  }, [])

  // Keyboard nav (disabled when editing text)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Don't hijack keyboard when editing text
      const active = document.activeElement
      if (active && (active.getAttribute("contenteditable") === "true" || active.tagName === "INPUT" || active.tagName === "TEXTAREA")) {
        return
      }
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault()
        goNext()
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        goPrev()
      }
      if (e.key === "e" || e.key === "E") {
        setShowToolbar((t) => !t)
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [goNext, goPrev])

  // Touch/swipe navigation
  useEffect(() => {
    const container = scrollRef.current
    if (!container) return
    const handleTouchStart = (e: TouchEvent) => {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return
      const dx = e.changedTouches[0].clientX - touchStartRef.current.x
      const dy = e.changedTouches[0].clientY - touchStartRef.current.y
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
        if (dx < 0) goNext()
        else goPrev()
      }
      touchStartRef.current = null
    }
    container.addEventListener("touchstart", handleTouchStart, { passive: true })
    container.addEventListener("touchend", handleTouchEnd, { passive: true })
    return () => {
      container.removeEventListener("touchstart", handleTouchStart)
      container.removeEventListener("touchend", handleTouchEnd)
    }
  }, [goNext, goPrev])

  const handleShare = async () => {
    const shareUrl = story.source_url || window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: story.story_headline, text: story.subhead, url: shareUrl })
      } else {
        await navigator.clipboard.writeText(shareUrl)
        alert("Link copied to clipboard!")
      }
    } catch {
      // User cancelled share or clipboard access denied
    }
  }

  // Handle photo swap
  const handlePhotoSelect = (slideIndex: number, url: string) => {
    setSlidePhotos((prev) => ({ ...prev, [slideIndex]: url }))
    setPhotoSearchSlide(null)
  }

  // Handle stat add
  const handleAddStat = (stat: StatOverlay) => {
    const currentPage = pages[currentSlide]
    if (currentPage.type === "slide" && currentPage.index !== undefined) {
      setSlideStats((prev) => ({ ...prev, [currentPage.index!]: stat }))
    }
    setShowChartModal(false)
    setEditMode(null)
  }

  const isTextEditable = editMode === "text" || showToolbar

  // Current page info for photo mode
  const currentPage = pages[currentSlide]
  const currentSlideIndex = currentPage?.type === "slide" ? currentPage.index : undefined

  return (
    <div className="relative w-full max-w-[393px] mx-auto" style={{ height: "min(852px, 100dvh)" }}>
      {/* Progress segments (Instagram Stories style) */}
      <div className="absolute top-0 left-0 right-0 z-40 flex gap-1 px-3 pt-2">
        {pages.map((_, i) => (
          <div
            key={i}
            className="h-[3px] flex-1 rounded-full transition-all duration-300"
            style={{ backgroundColor: i <= currentSlide ? "#FF6343" : "rgba(255,255,255,0.2)" }}
          />
        ))}
      </div>

      {/* Slide counter (top-right) - hidden on mobile when editing */}
      <div className={`absolute top-4 right-4 z-30 flex items-center gap-2 ${showToolbar ? "hidden sm:flex" : ""}`}>
        {/* Edit button - visible on desktop only when overlaid; mobile uses bottom bar */}
        <button
          onClick={() => {
            setShowToolbar((t) => !t)
            if (showToolbar) setEditMode(null)
          }}
          aria-label="Edit story"
          className={`hidden sm:flex font-mono text-[13px] px-3 py-1.5 rounded-full transition-all min-h-[32px] items-center gap-1.5 ${
            showToolbar
              ? "bg-nr-red/30 text-nr-red border border-nr-red/40"
              : "bg-black/50 backdrop-blur-sm text-white/70 border border-white/20 hover:text-white hover:border-white/40"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M10.08 1.92a1.5 1.5 0 012.12 0l.88.88a1.5 1.5 0 010 2.12L5.5 12.5 1.5 13l.5-4 8.08-7.08z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {showToolbar ? "Editing" : "Edit"}
        </button>
        <span className={`font-mono text-[11px] text-white/50 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full ${showToolbar ? "hidden sm:inline" : ""}`}>
          {currentSlide + 1} of {totalPages}
        </span>
      </div>

      {/* Mobile edit button - below slide viewer area, part of bottom controls */}
      {!showToolbar && !keyboardOpen && (
        <button
          onClick={() => setShowToolbar(true)}
          aria-label="Edit story"
          className="sm:hidden absolute bottom-[52px] right-4 z-30 font-mono text-[12px] px-3 py-1.5 rounded-full transition-all min-h-[32px] flex items-center gap-1.5 bg-black/50 backdrop-blur-sm text-white/70 border border-white/20 active:text-white active:border-white/40"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M10.08 1.92a1.5 1.5 0 012.12 0l.88.88a1.5 1.5 0 010 2.12L5.5 12.5 1.5 13l.5-4 8.08-7.08z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Edit
        </button>
      )}

      {/* Edit hint on first load */}
      {!showToolbar && currentSlide === 0 && (
        <div className="absolute bottom-[52px] left-0 right-0 z-10 text-center pointer-events-none">
          <p className="font-mono text-[11px] text-white/50">Tap Edit to customize photos and text</p>
        </div>
      )}

      {/* Chart modal */}
      {showChartModal && (
        <AddChartModal
          onAdd={handleAddStat}
          onClose={() => {
            setShowChartModal(false)
            setEditMode(null)
          }}
        />
      )}

      {/* Slide container */}
      <div
        ref={scrollRef}
        className="flex w-full h-full overflow-x-auto slide-container hide-scrollbar"
      >
        {pages.map((page, pageIndex) => {
          // ─── Headline Card ──────────────────────────────
          if (page.type === "headline") {
            const coverPhoto = slidePhotos[0]
            return (
              <div
                key={`headline-${pageIndex}`}
                className="slide-item flex-shrink-0 w-full h-full relative overflow-hidden"
                style={{ background: GRADIENTS[0] }}
              >
                {/* Cover photo */}
                {coverPhoto && (
                  <>
                    <img
                      src={coverPhoto}
                      alt=""
                      className={`absolute inset-0 w-full h-full object-cover ${
                        showToolbar && editMode === "photo" ? "cursor-pointer" : ""
                      }`}
                      loading="eager"
                      onClick={() => {
                        if (showToolbar) {
                          setPhotoSearchSlide(0)
                        }
                      }}
                    />
                  </>
                )}
                {/* Dark gradient overlay */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.15) 30%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0.92) 85%, rgba(0,0,0,0.98) 100%)',
                  }}
                />

                {/* Photo swap indicator */}
                {showToolbar && editMode === "photo" && photoSearchSlide !== 0 && (
                  <button
                    onClick={() => setPhotoSearchSlide(0)}
                    className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-4 py-2 bg-black/60 backdrop-blur-sm border border-white/20 rounded-full text-white/70 text-xs font-mono hover:text-white hover:border-white/40 transition-all min-h-[44px] flex items-center gap-2"
                  >
                    <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
                      <rect x="2" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="6.5" cy="7.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
                      <path d="M2 12L6 9L9 11L12 8L16 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Tap to swap cover photo
                  </button>
                )}

                {/* Photo search overlay */}
                {photoSearchSlide === 0 && (
                  <PhotoSearchOverlay
                    defaultQuery={story.slides[0]?.image_query || story.story_headline}
                    onSelect={(url) => handlePhotoSelect(0, url)}
                    onClose={() => setPhotoSearchSlide(null)}
                  />
                )}

                {/* Source pill top-left */}
                {story.source_name && (
                  <div className="absolute top-10 left-4 z-10">
                    <span className="font-mono text-[10px] text-white/70 uppercase tracking-widest bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                      {story.source_name}
                    </span>
                  </div>
                )}

                {/* Headline + subhead at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-6 pb-20 z-10">
                  <EditableText
                    value={story.story_headline}
                    onChange={(v) => updateStory((s) => ({ ...s, story_headline: v }))}
                    editable={isTextEditable}
                    className="font-heading text-[24px] text-white leading-tight mb-2"
                    tag="h1"
                  />
                  <EditableText
                    value={story.subhead || ""}
                    onChange={(v) => updateStory((s) => ({ ...s, subhead: v }))}
                    editable={isTextEditable}
                    className="font-sans text-[14px] text-white/70 leading-relaxed mb-6"
                    tag="p"
                  />
                  {/* Swipe hint */}
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-white/60 uppercase tracking-wider">
                      Swipe to read
                    </span>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-white/60">
                      <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
            )
          }

          // ─── Guess Slide ─────────────────────────────────
          if (page.type === "guess" && story.guess) {
            return (
              <div
                key={`guess-${pageIndex}`}
                className="slide-item flex-shrink-0 w-full h-full relative flex flex-col items-center justify-center px-6"
                style={{ background: GRADIENTS[0] }}
              >
                <div className="glass-card rounded-2xl p-6 w-full max-w-sm">
                  <p className="font-mono text-nr-yellow text-xs uppercase tracking-wider mb-3">
                    Before you read
                  </p>
                  <EditableText
                    value={story.guess.question}
                    onChange={(v) =>
                      updateStory((s) => ({
                        ...s,
                        guess: s.guess ? { ...s.guess, question: v } : undefined,
                      }))
                    }
                    editable={isTextEditable}
                    className="font-heading text-white text-lg mb-6"
                    tag="p"
                  />
                  <div className="flex flex-col gap-3">
                    {story.guess.options.map((opt, i) => (
                      <div key={i} className="relative">
                        {isTextEditable ? (
                          <div
                            className="text-left px-4 py-3 rounded-xl border border-white/10 text-sm font-sans text-white"
                          >
                            <EditableText
                              value={opt}
                              onChange={(v) =>
                                updateStory((s) => {
                                  if (!s.guess) return s
                                  const opts = [...s.guess.options]
                                  opts[i] = v
                                  return { ...s, guess: { ...s.guess, options: opts } }
                                })
                              }
                              editable={true}
                              tag="span"
                            />
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setGuessAnswer(opt)
                              setTimeout(goNext, 600)
                            }}
                            className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm font-sans ${
                              guessAnswer === opt
                                ? "border-nr-yellow bg-nr-yellow/10 text-nr-yellow"
                                : "border-white/10 text-white hover:border-white/30"
                            }`}
                          >
                            {opt}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          }

          // ─── Quiz Slide ──────────────────────────────────
          if (page.type === "quiz" && story.quiz) {
            const quiz = story.quiz
            const isCorrect = quizAnswer === quiz.correct_answer
            return (
              <div
                key={`quiz-${pageIndex}`}
                className="slide-item flex-shrink-0 w-full h-full relative flex flex-col items-center justify-center px-6"
                style={{ background: GRADIENTS[GRADIENTS.length - 1] }}
              >
                <div className="glass-card rounded-2xl p-6 w-full max-w-sm">
                  <p className="font-mono text-nr-red text-xs uppercase tracking-wider mb-3">
                    Quiz time
                  </p>
                  <EditableText
                    value={quiz.question}
                    onChange={(v) =>
                      updateStory((s) => ({
                        ...s,
                        quiz: s.quiz ? { ...s.quiz, question: v } : undefined,
                      }))
                    }
                    editable={isTextEditable}
                    className="font-heading text-white text-lg mb-6"
                    tag="p"
                  />
                  <div className="flex flex-col gap-3">
                    {(["a", "b", "c", "d"] as const).map((key) => {
                      const isSelected = quizAnswer === key
                      const isCorrectAnswer = key === quiz.correct_answer
                      let borderColor = "border-white/10"
                      let bgColor = ""
                      let textColor = "text-white"

                      if (quizAnswer && !isTextEditable) {
                        if (isCorrectAnswer) {
                          borderColor = "border-green-500"
                          bgColor = "bg-green-500/10"
                          textColor = "text-green-400"
                        } else if (isSelected && !isCorrect) {
                          borderColor = "border-red-500"
                          bgColor = "bg-red-500/10"
                          textColor = "text-red-400"
                        }
                      }

                      return (
                        <div key={key} className="relative">
                          {isTextEditable ? (
                            <div
                              className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all text-sm font-sans ${borderColor} ${bgColor} ${textColor}`}
                            >
                              <button
                                onClick={() =>
                                  updateStory((s) => ({
                                    ...s,
                                    quiz: s.quiz ? { ...s.quiz, correct_answer: key } : undefined,
                                  }))
                                }
                                className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                  isCorrectAnswer
                                    ? "border-green-500 bg-green-500"
                                    : "border-white/30 hover:border-white/60"
                                }`}
                                title={isCorrectAnswer ? "Correct answer" : "Set as correct answer"}
                              >
                                {isCorrectAnswer && (
                                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                    <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </button>
                              <span className="font-mono text-xs opacity-50 mr-1 uppercase">{key}.</span>
                              <EditableText
                                value={quiz.answers[key]}
                                onChange={(v) =>
                                  updateStory((s) => ({
                                    ...s,
                                    quiz: s.quiz
                                      ? { ...s.quiz, answers: { ...s.quiz.answers, [key]: v } }
                                      : undefined,
                                  }))
                                }
                                editable={true}
                                tag="span"
                                className="flex-1"
                              />
                            </div>
                          ) : (
                            <button
                              onClick={() => !quizAnswer && setQuizAnswer(key)}
                              disabled={!!quizAnswer}
                              aria-label={quiz.answers[key]}
                              className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm font-sans ${borderColor} ${bgColor} ${textColor} ${
                                !quizAnswer ? "hover:border-white/30" : ""
                              }`}
                            >
                              <span className="font-mono text-xs opacity-50 mr-2 uppercase">{key}.</span>
                              {quiz.answers[key]}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  {quizAnswer && !isTextEditable && (
                    <p className={`text-sm mt-4 font-sans ${isCorrect ? "text-green-400" : "text-red-400"}`}>
                      {isCorrect ? "Correct!" : `The answer was ${quiz.correct_answer.toUpperCase()}.`}
                    </p>
                  )}
                </div>
              </div>
            )
          }

          // ─── Quick Poll Slide ─────────────────────────────
          if (page.type === "quick_poll" && story.quick_poll) {
            const poll = story.quick_poll
            return (
              <div
                key={`poll-${pageIndex}`}
                className="slide-item flex-shrink-0 w-full h-full relative flex flex-col items-center justify-center px-6"
                style={{ background: GRADIENTS[3] }}
              >
                <div className="w-full max-w-sm text-center">
                  <p className="font-mono text-nr-red text-xs uppercase tracking-wider mb-4">
                    This or that
                  </p>
                  {isTextEditable ? (
                    <>
                      <EditableText
                        value={poll.question}
                        onChange={(v) =>
                          updateStory((s) => ({
                            ...s,
                            quick_poll: s.quick_poll ? { ...s.quick_poll, question: v } : undefined,
                          }))
                        }
                        editable={true}
                        className="font-heading text-white text-xl mb-8 leading-tight"
                        tag="p"
                      />
                      <div className="flex gap-3">
                        <div className="flex-1 px-5 py-4 rounded-xl border border-white/20 text-white text-sm font-sans">
                          <EditableText
                            value={poll.option_a}
                            onChange={(v) =>
                              updateStory((s) => ({
                                ...s,
                                quick_poll: s.quick_poll ? { ...s.quick_poll, option_a: v } : undefined,
                              }))
                            }
                            editable={true}
                            tag="span"
                          />
                        </div>
                        <div className="flex-1 px-5 py-4 rounded-xl border border-white/20 text-white text-sm font-sans">
                          <EditableText
                            value={poll.option_b}
                            onChange={(v) =>
                              updateStory((s) => ({
                                ...s,
                                quick_poll: s.quick_poll ? { ...s.quick_poll, option_b: v } : undefined,
                              }))
                            }
                            editable={true}
                            tag="span"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="font-heading text-white text-xl mb-8 leading-tight">
                        {poll.question}
                      </p>
                      {pollAnswer ? (
                        <div className="space-y-3">
                          <div className={`px-5 py-4 rounded-xl border text-sm font-sans text-center transition-all ${
                            pollAnswer === "a"
                              ? "border-[#FF6343] bg-[#FF6343]/15 text-white"
                              : "border-white/10 text-white/50"
                          }`}>
                            {poll.option_a}
                          </div>
                          <div className={`px-5 py-4 rounded-xl border text-sm font-sans text-center transition-all ${
                            pollAnswer === "b"
                              ? "border-[#FF6343] bg-[#FF6343]/15 text-white"
                              : "border-white/10 text-white/50"
                          }`}>
                            {poll.option_b}
                          </div>
                          <p className="font-sans text-white/50 text-sm mt-4">
                            Thanks! {pollPercent}% of readers picked {pollAnswer === "a" ? poll.option_a : poll.option_b}.
                          </p>
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <button
                            onClick={() => setPollAnswer("a")}
                            className="flex-1 px-5 py-4 rounded-xl border border-white/20 text-white text-sm font-sans hover:border-white/40 hover:bg-white/5 transition-all"
                          >
                            {poll.option_a}
                          </button>
                          <button
                            onClick={() => setPollAnswer("b")}
                            className="flex-1 px-5 py-4 rounded-xl border border-white/20 text-white text-sm font-sans hover:border-white/40 hover:bg-white/5 transition-all"
                          >
                            {poll.option_b}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          }

          // ─── Sponsored Slide ──────────────────────────────
          if (page.type === "sponsored" && sponsorSlide) {
            return (
              <div
                key={`sponsored-${pageIndex}`}
                className="slide-item flex-shrink-0 w-full h-full relative flex flex-col items-center justify-center px-6"
                style={{ background: "linear-gradient(135deg, #000000 0%, #0F0F0F 50%, #000000 100%)" }}
              >
                <div className="w-full max-w-sm">
                  <p className="font-mono text-[10px] text-white/60 uppercase tracking-widest mb-6 text-center">
                    Sponsored
                  </p>
                  <div className="glass-card rounded-2xl p-6 text-center">
                    <p className="font-heading text-white text-sm uppercase tracking-wider mb-4 opacity-70">
                      {sponsorSlide.name}
                    </p>
                    <p className="font-sans text-white text-[15px] leading-relaxed mb-6">
                      {sponsorSlide.message}
                    </p>
                    {sponsorSlide.link && /^https?:\/\//.test(sponsorSlide.link) && (
                      <a
                        href={sponsorSlide.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/20 text-white/70 text-sm font-mono hover:text-white hover:border-white/40 transition-all"
                      >
                        Learn more
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          }

          // ─── Completion Slide ──────────────────────────────
          if (page.type === "completion") {
            return (
              <div
                key={`completion-${pageIndex}`}
                className="slide-item flex-shrink-0 w-full h-full relative flex flex-col items-center justify-center px-6"
                style={{ background: "linear-gradient(135deg, #000000 0%, #0F0F0F 40%, #1F1F1F 100%)" }}
              >
                <div className="text-center max-w-sm">
                  <div
                    className="w-16 h-16 rounded-full border-2 border-[#FF6343] flex items-center justify-center mx-auto mb-6"
                    style={{
                      animation: currentSlide === pageIndex ? "completionBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards" : "none",
                      transform: currentSlide === pageIndex ? undefined : "scale(0)",
                    }}
                  >
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <path d="M7 14L12 19L21 9" stroke="#FF6343" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="font-heading text-2xl text-white mb-3">
                    You&apos;re caught up!
                  </p>
                  <p className="font-sans text-white/60 text-sm leading-relaxed mb-4">
                    {story.story_headline}
                  </p>
                  <p className="font-sans text-white/50 text-sm mb-6">
                    Read more stories on Newsreel
                  </p>
                  <a
                    href="https://newsreel.co"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FF6343] text-white text-sm font-mono hover:bg-[#FF6343]/80 transition-colors mb-3"
                  >
                    <div className="w-4 h-4 rounded bg-white/20 flex items-center justify-center font-heading text-[8px]">N</div>
                    Open in Newsreel
                  </a>
                  <br />
                  <button
                    onClick={handleShare}
                    aria-label="Share this story"
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl border border-white/20 text-white/60 text-xs font-mono hover:text-white hover:border-white/40 transition-colors mb-4"
                  >
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                      <path d="M10.5 5.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5zM3.5 9.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5zM10.5 13.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5zM5.4 8.12l3.22 1.76M8.6 4.12L5.4 5.88" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Share
                  </button>
                  {story.source_name && (
                    <p className="font-mono text-[10px] text-white/60 tracking-wider">
                      Created with Newsreel
                    </p>
                  )}
                </div>
                <style>{`
                  @keyframes completionBounce {
                    0% { transform: scale(0); }
                    60% { transform: scale(1.15); }
                    100% { transform: scale(1); }
                  }
                `}</style>
              </div>
            )
          }

          // ─── Regular Slide ───────────────────────────────
          const slideIndex = page.index!
          const slide = story.slides[slideIndex]
          const gradientIndex = (slideIndex + 1) % GRADIENTS.length
          const photoUrl = slidePhotos[slideIndex]
          const stat = slideStats[slideIndex]

          return (
            <div
              key={`slide-${pageIndex}`}
              className="slide-item flex-shrink-0 w-full h-full relative overflow-hidden"
              style={{ background: GRADIENTS[gradientIndex] }}
            >
              {/* Photo background */}
              {photoUrl && (
                <>
                  <img
                    src={photoUrl}
                    alt=""
                    className={`absolute inset-0 w-full h-full object-cover ${
                      showToolbar && editMode === "photo" ? "cursor-pointer" : ""
                    }`}
                    loading="lazy"
                    onClick={() => {
                      if (showToolbar) {
                        setPhotoSearchSlide(slideIndex)
                      }
                    }}
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.85) 70%, rgba(0,0,0,0.95) 100%)",
                    }}
                  />
                </>
              )}

              {/* Photo swap indicator */}
              {showToolbar && editMode === "photo" && !photoSearchSlide && (
                <button
                  onClick={() => setPhotoSearchSlide(slideIndex)}
                  className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-4 py-2 bg-black/60 backdrop-blur-sm border border-white/20 rounded-full text-white/70 text-xs font-mono hover:text-white hover:border-white/40 transition-all min-h-[44px] flex items-center gap-2"
                >
                  <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
                    <rect x="2" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="6.5" cy="7.5" r="1.5" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M2 12L6 9L9 11L12 8L16 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Tap to swap photo
                </button>
              )}

              {/* Photo search overlay */}
              {photoSearchSlide === slideIndex && (
                <PhotoSearchOverlay
                  defaultQuery={slide.image_query || ""}
                  onSelect={(url) => handlePhotoSelect(slideIndex, url)}
                  onClose={() => setPhotoSearchSlide(null)}
                />
              )}

              {/* Stat overlay */}
              {stat && <StatCard stat={stat} />}

              {/* Animated stat number for "By the numbers" slides */}
              {slide.subheadline.toLowerCase().includes("numbers") && (() => {
                const parsedStat = parseStatNumber(slide.content)
                if (!parsedStat) return null
                return (
                  <div className="absolute top-1/3 left-0 right-0 flex justify-center z-10 pointer-events-none">
                    <div className="text-center">
                      <AnimatedNumber
                        value={parsedStat.value}
                        prefix={parsedStat.prefix}
                        suffix={parsedStat.suffix}
                        active={currentSlide === pageIndex}
                      />
                    </div>
                  </div>
                )
              })()}

              {/* Content card at bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-5 pb-16 relative z-10">
                <div className="glass-card rounded-2xl p-5">
                  <EditableText
                    value={`${getIcon(slide.subheadline)} ${slide.subheadline}`}
                    onChange={(v) => {
                      // Strip leading emoji + space
                      const cleaned = v.replace(/^[\p{Emoji}\uFE0F\u200D]+\s*/u, "")
                      updateStory((s) => {
                        const slides = [...s.slides]
                        slides[slideIndex] = { ...slides[slideIndex], subheadline: cleaned }
                        return { ...s, slides }
                      })
                    }}
                    editable={isTextEditable}
                    className="font-mono text-nr-red text-xs tracking-wider mb-2"
                    tag="p"
                  />
                  <EditableText
                    value={slide.content || "No content for this slide"}
                    onChange={(v) =>
                      updateStory((s) => {
                        const slides = [...s.slides]
                        slides[slideIndex] = { ...slides[slideIndex], content: v }
                        return { ...s, slides }
                      })
                    }
                    editable={isTextEditable}
                    className={`font-sans text-[15px] leading-relaxed ${slide.content ? "text-white" : "text-white/40 italic"}`}
                    tag="p"
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Navigation arrows */}
      {currentSlide > 0 && (
        <button
          onClick={goPrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-white/70 hover:text-white transition-all"
          aria-label="Previous slide"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12 15L7 10L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
      {currentSlide < totalPages - 1 && (
        <button
          onClick={goNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-white/70 hover:text-white transition-all"
          aria-label="Next slide"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M8 5L13 10L8 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {/* Edit toolbar */}
      {showToolbar && (
        <EditToolbar
          editMode={editMode}
          keyboardOpen={keyboardOpen}
          onSetMode={(mode) => {
            setEditMode(mode)
            if (mode === "chart") {
              setShowChartModal(true)
            }
            if (mode === "photo" && currentSlideIndex !== undefined) {
              // Auto-open photo search for current slide
              setPhotoSearchSlide(currentSlideIndex)
            }
          }}
          onDone={() => {
            setShowToolbar(false)
            setEditMode(null)
            setPhotoSearchSlide(null)
          }}
          onRecord={() => setShowRecorder(true)}
        />
      )}

      {/* Bottom bar - hidden when keyboard is open on mobile */}
      <div className={`absolute bottom-0 left-0 right-0 z-20 flex items-center justify-between px-5 py-3 bg-black/80 backdrop-blur ${keyboardOpen ? "hidden" : ""}`}>
        <a
          href="https://newsreel.co"
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[10px] text-nr-ash tracking-wider hover:text-white transition-colors flex items-center gap-1.5"
        >
          <div className="w-3.5 h-3.5 rounded-sm bg-nr-red flex items-center justify-center font-heading text-[6px] text-white">N</div>
          Read on <span className="text-nr-red">Newsreel</span>
        </a>
        <button
          onClick={handleShare}
          aria-label="Share this story"
          className="flex items-center gap-1.5 text-xs font-mono text-white/60 hover:text-white transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M10.5 5.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5zM3.5 9.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5zM10.5 13.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5zM5.4 8.12l3.22 1.76M8.6 4.12L5.4 5.88"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Share
        </button>
      </div>

      {/* Video Recorder Modal */}
      {showRecorder && (
        <AuthorVideoRecorder
          backgroundUrl={
            currentSlideIndex !== undefined
              ? slidePhotos[currentSlideIndex]
              : undefined
          }
          onRecordingComplete={(file) => {
            // Create a URL for the recorded video and set it as the slide's photo
            const url = URL.createObjectURL(file)
            if (currentSlideIndex !== undefined) {
              setSlidePhotos(prev => ({ ...prev, [currentSlideIndex]: url }))
            }
            setShowRecorder(false)
          }}
          onClose={() => setShowRecorder(false)}
        />
      )}
    </div>
  )
}
