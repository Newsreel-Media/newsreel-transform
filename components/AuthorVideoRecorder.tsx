'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface AuthorVideoRecorderProps {
  /** Background image URL to show behind the person */
  backgroundUrl?: string
  /** Called when recording is complete */
  onRecordingComplete: (file: File) => void
  /** Called when user cancels */
  onClose: () => void
}

const MAX_DURATION = 60 // seconds

export function AuthorVideoRecorder({ backgroundUrl, onRecordingComplete, onClose }: AuthorVideoRecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bgImageRef = useRef<HTMLImageElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const animFrameRef = useRef<number>(0)
  const segmenterRef = useRef<any>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [isReady, setIsReady] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Load background image
  useEffect(() => {
    if (backgroundUrl) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = backgroundUrl
      img.onload = () => { bgImageRef.current = img }
    }
  }, [backgroundUrl])

  // Initialize webcam and segmenter
  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        // Request webcam
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 720, height: 1280, facingMode: 'user' },
          audio: true,
        })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }

        // Load MediaPipe SelfieSegmentation
        // @ts-ignore - loaded from CDN dynamically
        const { SelfieSegmentation } = await import('@mediapipe/selfie_segmentation')

        const segmenter = new SelfieSegmentation({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
        })
        segmenter.setOptions({ modelSelection: 0 }) // 0 = general model
        segmenter.onResults((results: any) => {
          drawComposite(results)
        })

        if (cancelled) return
        segmenterRef.current = segmenter
        setIsReady(true)

        // Start render loop
        renderLoop(segmenter)
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to access camera')
      }
    }

    init()

    return () => {
      cancelled = true
      cancelAnimationFrame(animFrameRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
      segmenterRef.current?.close?.()
      if (timerRef.current) clearInterval(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const renderLoop = useCallback((segmenter: any) => {
    const tick = async () => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        await segmenter.send({ image: videoRef.current })
      }
      animFrameRef.current = requestAnimationFrame(tick)
    }
    animFrameRef.current = requestAnimationFrame(tick)
  }, [])

  const drawComposite = useCallback((results: any) => {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = video.videoWidth || 720
    canvas.height = video.videoHeight || 1280

    // Draw background (slide image or dark fill)
    if (bgImageRef.current) {
      // Cover-fit the background
      const img = bgImageRef.current
      const scale = Math.max(canvas.width / img.width, canvas.height / img.height)
      const w = img.width * scale
      const h = img.height * scale
      ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h)
      // Slight darken overlay so person stands out
      ctx.fillStyle = 'rgba(0,0,0,0.3)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    } else {
      ctx.fillStyle = '#18181b'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    // Use segmentation mask to composite person
    const mask = results.segmentationMask
    if (mask) {
      // Create temporary canvas with just the person
      const tmp = document.createElement('canvas')
      tmp.width = canvas.width
      tmp.height = canvas.height
      const tmpCtx = tmp.getContext('2d')!
      tmpCtx.drawImage(results.image, 0, 0, canvas.width, canvas.height)

      // Use mask as alpha
      const tmpData = tmpCtx.getImageData(0, 0, canvas.width, canvas.height)

      // Draw mask to another canvas to read pixel data
      const maskCanvas = document.createElement('canvas')
      maskCanvas.width = canvas.width
      maskCanvas.height = canvas.height
      const maskCtx = maskCanvas.getContext('2d')!
      maskCtx.drawImage(mask, 0, 0, canvas.width, canvas.height)
      const maskData = maskCtx.getImageData(0, 0, canvas.width, canvas.height)

      // Apply mask: where mask is bright = person
      for (let i = 0; i < tmpData.data.length; i += 4) {
        const maskAlpha = maskData.data[i] // R channel of mask
        tmpData.data[i + 3] = maskAlpha // Set alpha
      }
      tmpCtx.putImageData(tmpData, 0, 0)

      // Draw person on top of background
      ctx.drawImage(tmp, 0, 0)
    }
  }, [])

  const startRecording = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !streamRef.current) return

    chunksRef.current = []

    // Capture canvas video stream + original audio
    const canvasStream = canvas.captureStream(30)
    const audioTracks = streamRef.current.getAudioTracks()
    audioTracks.forEach(t => canvasStream.addTrack(t))

    const recorder = new MediaRecorder(canvasStream, {
      mimeType: 'video/webm;codecs=vp9',
    })

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      const file = new File([blob], `author-commentary-${Date.now()}.webm`, { type: 'video/webm' })
      onRecordingComplete(file)
    }

    recorder.start(100) // collect data every 100ms
    recorderRef.current = recorder
    setIsRecording(true)
    setElapsed(0)

    // Timer
    timerRef.current = setInterval(() => {
      setElapsed(prev => {
        if (prev + 1 >= MAX_DURATION) {
          stopRecording()
          return MAX_DURATION
        }
        return prev + 1
      })
    }, 1000)
  }, [onRecordingComplete])

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setIsRecording(false)
  }, [])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="rounded-xl border border-white/10 shadow-2xl max-w-md w-full overflow-hidden" style={{ background: '#111' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-sm font-semibold text-white">Record Commentary</h3>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded text-white/60 hover:text-white">
            ✕
          </button>
        </div>

        {/* Video preview */}
        <div className="relative bg-black aspect-[9/16] max-h-[60vh]">
          <video ref={videoRef} playsInline muted className="hidden" />
          <canvas ref={canvasRef} className="w-full h-full object-contain" />

          {error && (
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          {!isReady && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-white/60 text-sm">Starting camera...</p>
            </div>
          )}

          {isRecording && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 rounded-full px-3 py-1">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-white text-xs font-mono">{formatTime(elapsed)} / {formatTime(MAX_DURATION)}</span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 p-4">
          {!isRecording ? (
            <button
              onClick={startRecording}
              disabled={!isReady}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50 flex items-center gap-2"
            >
              🎬 Record
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium flex items-center gap-2"
            >
              ⏹ Stop Recording
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
