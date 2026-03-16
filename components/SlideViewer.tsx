"use client"

import { useState, useRef, useEffect, useCallback } from "react"

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

// Gradient palette for slide backgrounds
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

// Subheadline icon mapping
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

export default function SlideViewer({ story }: { story: Story }) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null)
  const [guessAnswer, setGuessAnswer] = useState<string | null>(null)
  const [slidePhotos, setSlidePhotos] = useState<Record<number, string>>({})
  const scrollRef = useRef<HTMLDivElement>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  // Fetch photos/gifs for each slide on mount
  useEffect(() => {
    story.slides.forEach((slide, i) => {
      if (!slide.image_query) return
      // Every 3rd slide gets a GIF for visual variety
      const type = i % 3 === 1 ? 'gif' : 'photo'
      fetch(`/api/photos?q=${encodeURIComponent(slide.image_query)}&type=${type}`)
        .then(r => r.json())
        .then(data => {
          if (data.url) {
            setSlidePhotos(prev => ({ ...prev, [i]: data.url }))
          }
        })
        .catch(() => {
          // Fallback: if GIF fails, try photo
          if (type === 'gif' && slide.image_query) {
            fetch(`/api/photos?q=${encodeURIComponent(slide.image_query)}&type=photo`)
              .then(r => r.json())
              .then(data => {
                if (data.url) setSlidePhotos(prev => ({ ...prev, [i]: data.url }))
              })
              .catch(() => {})
          }
        })
    })
  }, [story.slides])

  // Total "pages": slides + guess (if present) + quiz (if present)
  const pages: Array<{ type: "slide" | "guess" | "quiz"; index?: number }> = []

  // Add guess page first if present
  if (story.guess) {
    pages.push({ type: "guess" })
  }

  story.slides.forEach((_, i) => {
    pages.push({ type: "slide", index: i })
  })

  if (story.quiz) {
    pages.push({ type: "quiz" })
  }

  const totalPages = pages.length

  const scrollToSlide = useCallback((index: number) => {
    if (scrollRef.current) {
      const slideWidth = scrollRef.current.offsetWidth
      scrollRef.current.scrollTo({ left: slideWidth * index, behavior: "smooth" })
    }
  }, [])

  const goNext = useCallback(() => {
    if (currentSlide < totalPages - 1) {
      scrollToSlide(currentSlide + 1)
    }
  }, [currentSlide, totalPages, scrollToSlide])

  const goPrev = useCallback(() => {
    if (currentSlide > 0) {
      scrollToSlide(currentSlide - 1)
    }
  }, [currentSlide, scrollToSlide])

  // Handle scroll snap position changes
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

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault()
        goNext()
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        goPrev()
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
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return
      const dx = e.changedTouches[0].clientX - touchStartRef.current.x
      const dy = e.changedTouches[0].clientY - touchStartRef.current.y
      const absDx = Math.abs(dx)
      const absDy = Math.abs(dy)

      // Only register as swipe if horizontal movement is dominant and > 50px
      if (absDx > absDy && absDx > 50) {
        if (dx < 0) {
          goNext()
        } else {
          goPrev()
        }
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
      await navigator.share({
        title: story.story_headline,
        text: story.subhead,
        url: shareUrl,
      })
    } else {
      await navigator.clipboard.writeText(shareUrl)
      alert("Link copied to clipboard!")
    }
  }

  const progressPercent = totalPages > 1 ? ((currentSlide + 1) / totalPages) * 100 : 100

  return (
    <div className="relative w-full max-w-[393px] mx-auto" style={{ height: "min(852px, 100dvh)" }}>
      {/* Progress bar at very top */}
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
            style={{
              backgroundColor: i <= currentSlide ? "#FF6343" : "rgba(255,255,255,0.2)",
            }}
          />
        ))}
      </div>

      {/* Slide counter */}
      <div className="absolute top-4 right-4 z-30">
        <span className="font-mono text-[11px] text-white/50 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full">
          {currentSlide + 1} of {totalPages}
        </span>
      </div>

      {/* Slide container */}
      <div
        ref={scrollRef}
        className="flex w-full h-full overflow-x-auto slide-container hide-scrollbar"
      >
        {pages.map((page, pageIndex) => {
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
                  <p className="font-heading text-white text-lg mb-6">
                    {story.guess.question}
                  </p>
                  <div className="flex flex-col gap-3">
                    {story.guess.options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setGuessAnswer(opt)
                          setTimeout(goNext, 600)
                        }}
                        className={`text-left px-4 py-3 rounded-xl border transition-all text-sm font-sans ${
                          guessAnswer === opt
                            ? "border-nr-yellow bg-nr-yellow/10 text-nr-yellow"
                            : "border-white/10 text-white hover:border-white/30"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )
          }

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
                  <p className="font-heading text-white text-lg mb-6">
                    {quiz.question}
                  </p>
                  <div className="flex flex-col gap-3">
                    {(["a", "b", "c", "d"] as const).map((key) => {
                      const isSelected = quizAnswer === key
                      const isCorrectAnswer = key === quiz.correct_answer
                      let borderColor = "border-white/10"
                      let bgColor = ""
                      let textColor = "text-white"

                      if (quizAnswer) {
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
                        <button
                          key={key}
                          onClick={() => !quizAnswer && setQuizAnswer(key)}
                          disabled={!!quizAnswer}
                          className={`text-left px-4 py-3 rounded-xl border transition-all text-sm font-sans ${borderColor} ${bgColor} ${textColor} ${
                            !quizAnswer ? "hover:border-white/30" : ""
                          }`}
                        >
                          <span className="font-mono text-xs opacity-50 mr-2 uppercase">{key}.</span>
                          {quiz.answers[key]}
                        </button>
                      )
                    })}
                  </div>
                  {quizAnswer && (
                    <p className={`text-sm mt-4 font-sans ${isCorrect ? "text-green-400" : "text-red-400"}`}>
                      {isCorrect ? "Correct!" : `The answer was ${quiz.correct_answer.toUpperCase()}.`}
                    </p>
                  )}
                </div>
              </div>
            )
          }

          // Regular slide
          const slide = story.slides[page.index!]
          const gradientIndex = (page.index! + 1) % GRADIENTS.length
          const photoUrl = slidePhotos[page.index!]
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
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                  {/* Gradient overlay so text is readable */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.85) 70%, rgba(0,0,0,0.95) 100%)',
                    }}
                  />
                </>
              )}

              {/* Content card at bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-5 pb-16 relative z-10">
                {/* Source badge on first slide */}
                {page.index === 0 && story.source_name && (
                  <div className="inline-block mb-3">
                    <span className="font-mono text-[10px] text-nr-gray-400 uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full">
                      {story.source_name}
                    </span>
                  </div>
                )}

                {/* Headline on first slide */}
                {page.index === 0 && (
                  <h1 className="font-heading text-2xl text-white leading-tight mb-3">
                    {story.story_headline}
                  </h1>
                )}

                <div className="glass-card rounded-2xl p-5">
                  <p className="font-mono text-nr-red text-xs tracking-wider mb-2">
                    {getIcon(slide.subheadline)} {slide.subheadline}
                  </p>
                  <p className="font-sans text-white text-[15px] leading-relaxed">
                    {slide.content}
                  </p>
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
            <path d="M12 15L7 10L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
            <path d="M8 5L13 10L8 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      {/* Bottom bar with source attribution */}
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
            <path d="M10.5 5.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5zM3.5 9.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5zM10.5 13.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5zM5.4 8.12l3.22 1.76M8.6 4.12L5.4 5.88" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Share
        </button>
      </div>
    </div>
  )
}
