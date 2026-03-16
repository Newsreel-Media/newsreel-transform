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

interface Story {
  story_headline: string
  subhead: string
  source_name?: string
  source_url?: string
  slides: Slide[]
  quiz?: Quiz
  guess?: Guess
}

interface StatOverlay {
  value: string
  label: string
  source: string
}

type EditMode = null | "photo" | "text" | "record" | "chart"

// ─── Constants ───────────────────────────────────────────────────────
const GRADIENTS = [
  "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
  "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
  "linear-gradient(135deg, #1a0a2e 0%, #3d1f5c 50%, #1a1a2e 100%)",
  "linear-gradient(135deg, #0d1117 0%, #161b22 50%, #0d1117 100%)",
  "linear-gradient(135deg, #1e1e2f 0%, #2d1b4e 50%, #1a1a2e 100%)",
  "linear-gradient(135deg, #0a0a1a 0%, #1a2a3a 50%, #0a1a2a 100%)",
  "linear-gradient(135deg, #111827 0%, #1f2937 50%, #111827 100%)",
  "linear-gradient(135deg, #1a1a2e 0%, #2a1a3e 50%, #1a0a2e 100%)",
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
    <div className="absolute inset-x-0 top-0 z-50 p-3" onClick={(e) => e.stopPropagation()}>
      <div className="glass-card rounded-xl p-3">
        <div className="flex items-center gap-2 mb-2">
          <input
            ref={inputRef}
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
          <p className="text-white/30 text-xs font-mono text-center py-2">
            Hit enter or tap search to find photos
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Stat Card Overlay ──────────────────────────────────────────────
function StatCard({ stat }: { stat: StatOverlay }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
      <div className="glass-card rounded-2xl p-6 text-center max-w-[280px] pointer-events-auto">
        <p className="font-heading text-4xl text-white mb-2">{stat.value}</p>
        <p className="font-sans text-white/80 text-sm leading-relaxed mb-2">{stat.label}</p>
        <p className="font-mono text-[10px] text-white/40 uppercase tracking-wider">{stat.source}</p>
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
}: {
  editMode: EditMode
  onSetMode: (mode: EditMode) => void
  onDone: () => void
  onRecord: () => void
}) {
  const [showRecordTip, setShowRecordTip] = useState(false)
  void showRecordTip // suppress unused warning

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

// ─── Main StoryEditor ───────────────────────────────────────────────
export default function StoryEditor({
  story: initialStory,
  onStoryChange,
}: {
  story: Story
  onStoryChange?: (story: Story) => void
}) {
  const [story, setStory] = useState<Story>(initialStory)
  const [editMode, setEditMode] = useState<EditMode>(null)
  const [showToolbar, setShowToolbar] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null)
  const [guessAnswer, setGuessAnswer] = useState<string | null>(null)
  const [slidePhotos, setSlidePhotos] = useState<Record<number, string>>({})
  const [photoSearchSlide, setPhotoSearchSlide] = useState<number | null>(null)
  const [showChartModal, setShowChartModal] = useState(false)
  const [showRecorder, setShowRecorder] = useState(false)
  const [slideStats, setSlideStats] = useState<Record<number, StatOverlay>>({})
  const scrollRef = useRef<HTMLDivElement>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

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

  // Fetch photos on mount
  useEffect(() => {
    story.slides.forEach((slide, i) => {
      if (!slide.image_query) return
      const type = i % 3 === 1 ? "gif" : "photo"
      fetch(`/api/photos?q=${encodeURIComponent(slide.image_query)}&type=${type}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.url) {
            setSlidePhotos((prev) => ({ ...prev, [i]: data.url }))
          }
        })
        .catch(() => {
          if (type === "gif" && slide.image_query) {
            fetch(`/api/photos?q=${encodeURIComponent(slide.image_query)}&type=photo`)
              .then((r) => r.json())
              .then((data) => {
                if (data.url) setSlidePhotos((prev) => ({ ...prev, [i]: data.url }))
              })
              .catch(() => {})
          }
        })
    })
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Page list
  const pages: Array<{ type: "slide" | "guess" | "quiz"; index?: number }> = []
  if (story.guess) pages.push({ type: "guess" })
  story.slides.forEach((_, i) => pages.push({ type: "slide", index: i }))
  if (story.quiz) pages.push({ type: "quiz" })
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
    if (navigator.share) {
      await navigator.share({ title: story.story_headline, text: story.subhead, url: shareUrl })
    } else {
      await navigator.clipboard.writeText(shareUrl)
      alert("Link copied to clipboard!")
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

  const progressPercent = totalPages > 1 ? ((currentSlide + 1) / totalPages) * 100 : 100

  return (
    <div className="relative w-full max-w-[393px] mx-auto" style={{ height: "min(852px, 100dvh)" }}>
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 z-40 h-[3px] bg-white/10">
        <div
          className="h-full bg-nr-red transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Progress dots */}
      <div className="absolute top-[6px] left-0 right-0 z-30 flex gap-1 px-3 pt-1">
        {pages.map((_, i) => (
          <div
            key={i}
            className="h-[3px] flex-1 rounded-full transition-all duration-300"
            style={{ backgroundColor: i <= currentSlide ? "#FF6343" : "rgba(255,255,255,0.2)" }}
          />
        ))}
      </div>

      {/* Slide counter + edit toggle */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
        <button
          onClick={() => {
            setShowToolbar((t) => !t)
            if (showToolbar) setEditMode(null)
          }}
          className={`font-mono text-[11px] px-2 py-1 rounded-full transition-all min-h-[28px] ${
            showToolbar
              ? "bg-nr-red/30 text-nr-red border border-nr-red/40"
              : "bg-black/40 backdrop-blur-sm text-white/50 hover:text-white/80"
          }`}
        >
          {showToolbar ? "Editing" : "Edit"}
        </button>
        <span className="font-mono text-[11px] text-white/50 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full">
          {currentSlide + 1} of {totalPages}
        </span>
      </div>

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

              {/* Content card at bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-5 pb-16 relative z-10">
                {/* Source badge on first slide */}
                {slideIndex === 0 && story.source_name && (
                  <div className="inline-block mb-3">
                    <span className="font-mono text-[10px] text-nr-gray-400 uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full">
                      {story.source_name}
                    </span>
                  </div>
                )}

                {/* Headline on first slide */}
                {slideIndex === 0 && (
                  <EditableText
                    value={story.story_headline}
                    onChange={(v) => updateStory((s) => ({ ...s, story_headline: v }))}
                    editable={isTextEditable}
                    className="font-heading text-2xl text-white leading-tight mb-3"
                    tag="h1"
                  />
                )}

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
                    value={slide.content}
                    onChange={(v) =>
                      updateStory((s) => {
                        const slides = [...s.slides]
                        slides[slideIndex] = { ...slides[slideIndex], content: v }
                        return { ...s, slides }
                      })
                    }
                    editable={isTextEditable}
                    className="font-sans text-white text-[15px] leading-relaxed"
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

      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-between px-5 py-3 bg-black/80 backdrop-blur">
        {story.source_name && story.source_url ? (
          <a
            href={story.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] text-nr-gray-400 tracking-wider hover:text-white transition-colors truncate max-w-[60%]"
          >
            From <span className="text-white/70">{story.source_name}</span> &middot; Original article
          </a>
        ) : (
          <span className="font-mono text-[10px] text-nr-gray-400 tracking-wider">
            Made with <span className="text-nr-red">Newsreel</span>
          </span>
        )}
        <button
          onClick={handleShare}
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
