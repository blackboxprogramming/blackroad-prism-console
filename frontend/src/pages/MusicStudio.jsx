import React, { useEffect, useMemo, useRef, useState } from 'react'

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const BLACK_KEYS = new Set(['C#', 'D#', 'F#', 'G#', 'A#'])

const INSTRUMENTS = {
  synth: {
    label: 'Synth Lead',
    oscillator: 'sawtooth',
    attack: 0.02,
    release: 1.2,
    gain: 0.5,
  },
  keys: {
    label: 'Electric Keys',
    oscillator: 'triangle',
    attack: 0.03,
    release: 1.4,
    gain: 0.6,
  },
  bass: {
    label: 'Deep Bass',
    oscillator: 'square',
    attack: 0.01,
    release: 1.8,
    gain: 0.45,
  },
  pad: {
    label: 'Warm Pad',
    oscillator: 'sine',
    attack: 0.12,
    release: 2.6,
    gain: 0.55,
  },
}

const DRUMS = {
  kick: {
    label: 'Kick',
    trigger: (ctx, time) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(150, time)
      osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5)

      gain.gain.setValueAtTime(1, time)
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(time)
      osc.stop(time + 0.5)
    },
  },
  snare: {
    label: 'Snare',
    trigger: (ctx, time) => {
      const noiseBuffer = createNoiseBuffer(ctx, 0.2)
      const noise = ctx.createBufferSource()
      noise.buffer = noiseBuffer

      const noiseFilter = ctx.createBiquadFilter()
      noiseFilter.type = 'highpass'
      noiseFilter.frequency.value = 1000
      const noiseGain = ctx.createGain()
      noiseGain.gain.setValueAtTime(1, time)
      noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2)

      noise.connect(noiseFilter)
      noiseFilter.connect(noiseGain)
      noiseGain.connect(ctx.destination)

      noise.start(time)
      noise.stop(time + 0.2)

      const osc = ctx.createOscillator()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(200, time)
      const oscGain = ctx.createGain()
      oscGain.gain.setValueAtTime(0.6, time)
      oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1)

      osc.connect(oscGain)
      oscGain.connect(ctx.destination)

      osc.start(time)
      osc.stop(time + 0.2)
    },
  },
  hat: {
    label: 'Hi-Hat',
    trigger: (ctx, time) => {
      const noiseBuffer = createNoiseBuffer(ctx, 0.1)
      const noise = ctx.createBufferSource()
      noise.buffer = noiseBuffer

      const bandpass = ctx.createBiquadFilter()
      bandpass.type = 'highpass'
      bandpass.frequency.value = 6000

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.7, time)
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.07)

      noise.connect(bandpass)
      bandpass.connect(gain)
      gain.connect(ctx.destination)

      noise.start(time)
      noise.stop(time + 0.1)
    },
  },
}

function noteToFrequency(note, octave) {
  const index = NOTES.indexOf(note)
  const midi = 12 * (octave + 1) + index
  return 440 * Math.pow(2, (midi - 69) / 12)
}

function createNoiseBuffer(ctx, duration) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1
  }
  return buffer
}

export default function MusicStudio() {
  const [instrument, setInstrument] = useState('synth')
  const [octave, setOctave] = useState(4)
  const [isRecording, setIsRecording] = useState(false)
  const [sequence, setSequence] = useState([])
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef(null)
  const recordStart = useRef(0)

  const instrumentList = useMemo(() => Object.entries(INSTRUMENTS), [])
  const drumList = useMemo(() => Object.entries(DRUMS), [])

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.close()
        audioRef.current = null
      }
    }
  }, [])

  function getAudioContext() {
    if (!audioRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      audioRef.current = new AudioCtx()
    }
    return audioRef.current
  }

  async function ensureAudioContext() {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }
    return ctx
  }

  function playMelodyNote(ctx, note, octaveValue, instrumentKey, when = ctx.currentTime) {
    const config = INSTRUMENTS[instrumentKey]
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()

    oscillator.type = config.oscillator
    oscillator.frequency.setValueAtTime(noteToFrequency(note, octaveValue), when)

    const attack = config.attack
    const release = config.release
    const peak = config.gain

    gain.gain.setValueAtTime(0, when)
    gain.gain.linearRampToValueAtTime(peak, when + attack)
    gain.gain.exponentialRampToValueAtTime(0.001, when + attack + release)

    oscillator.connect(gain)
    gain.connect(ctx.destination)

    oscillator.start(when)
    oscillator.stop(when + attack + release + 0.05)
  }

  function triggerDrum(ctx, drumKey, when = ctx.currentTime) {
    const drum = DRUMS[drumKey]
    drum?.trigger(ctx, when)
  }

  async function handleNoteClick(note) {
    const ctx = await ensureAudioContext()
    playMelodyNote(ctx, note, octave, instrument)
    if (isRecording) {
      const time = ctx.currentTime - recordStart.current
      setSequence(prev => [...prev, { type: 'note', note, octave, instrument, time }])
    }
  }

  async function handleDrumClick(drumKey) {
    const ctx = await ensureAudioContext()
    triggerDrum(ctx, drumKey)
    if (isRecording) {
      const time = ctx.currentTime - recordStart.current
      setSequence(prev => [...prev, { type: 'drum', drumKey, time }])
    }
  }

  async function startRecording() {
    const ctx = await ensureAudioContext()
    setSequence([])
    setIsRecording(true)
    recordStart.current = ctx.currentTime
  }

  function stopRecording() {
    setIsRecording(false)
  }

  async function playSequence() {
    if (!sequence.length) return
    const ctx = await ensureAudioContext()
    const startAt = ctx.currentTime + 0.1
    setIsPlaying(true)

    sequence.forEach(event => {
      if (event.type === 'note') {
        playMelodyNote(ctx, event.note, event.octave, event.instrument, startAt + event.time)
      }
      if (event.type === 'drum') {
        triggerDrum(ctx, event.drumKey, startAt + event.time)
      }
    })

    const endTime = Math.max(...sequence.map(evt => evt.time)) + 3
    setTimeout(() => setIsPlaying(false), endTime * 1000)
  }

  function clearSequence() {
    setSequence([])
    setIsRecording(false)
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 text-slate-100 space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Music Studio</h1>
        <p className="text-slate-400 max-w-3xl">
          Sketch melodies, layer drum ideas, and experiment with textures without touching a command line.
          Tap a key or pad, capture a loop, and let the console keep time for you and your fellow agents.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
        <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            {instrumentList.map(([key, config]) => (
              <button
                key={key}
                onClick={() => setInstrument(key)}
                className={`px-4 py-2 rounded-full border transition ${
                  instrument === key
                    ? 'border-pink-500 bg-pink-500/20 text-white'
                    : 'border-slate-700 text-slate-300 hover:border-slate-500'
                }`}
              >
                {config.label}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2 text-sm">
              <span className="text-slate-400">Octave</span>
              <button
                onClick={() => setOctave(o => Math.max(1, o - 1))}
                className="h-8 w-8 rounded-full bg-slate-800 hover:bg-slate-700"
              >
                −
              </button>
              <span className="w-6 text-center font-mono">{octave}</span>
              <button
                onClick={() => setOctave(o => Math.min(6, o + 1))}
                className="h-8 w-8 rounded-full bg-slate-800 hover:bg-slate-700"
              >
                +
              </button>
            </div>
          </div>

          <div className="relative h-48 bg-slate-950/50 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="absolute inset-0 flex">
              {NOTES.map(note => (
                <button
                  key={note}
                  onClick={() => handleNoteClick(note)}
                  className={`relative flex-1 border-r last:border-r-0 ${
                    BLACK_KEYS.has(note)
                      ? 'bg-slate-800 text-white border-slate-900'
                      : 'bg-slate-200 text-slate-900 border-slate-400'
                  }`}
                >
                  <span
                    className={`absolute left-1/2 -translate-x-1/2 bottom-3 text-xs font-medium ${
                      BLACK_KEYS.has(note) ? 'text-slate-200' : 'text-slate-700'
                    }`}
                  >
                    {note}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                isRecording ? 'bg-red-500/20 border border-red-500 text-red-300' : 'bg-pink-500/20 border border-pink-500 text-pink-200'
              }`}
            >
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
            <button
              onClick={playSequence}
              disabled={!sequence.length || isPlaying}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${
                sequence.length && !isPlaying
                  ? 'border-emerald-500 text-emerald-200 bg-emerald-500/10 hover:bg-emerald-500/20'
                  : 'border-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isPlaying ? 'Playing…' : 'Play Capture'}
            </button>
            <button
              onClick={clearSequence}
              disabled={!sequence.length}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${
                sequence.length
                  ? 'border-slate-600 text-slate-300 hover:border-slate-400'
                  : 'border-slate-800 text-slate-600 cursor-not-allowed'
              }`}
            >
              Clear
            </button>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm uppercase tracking-wide text-slate-400">Captured Events</h2>
            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
              {sequence.length === 0 && (
                <p className="text-slate-500 text-sm">
                  Hit record, play the piano keys or drum pads, and we will remember the groove for you.
                </p>
              )}
              {sequence.map((event, index) => (
                <div
                  key={`${event.type}-${index}-${event.time}`}
                  className="flex items-center justify-between bg-slate-950/60 border border-slate-800 rounded-2xl px-3 py-2 text-xs"
                >
                  <span className="font-medium text-slate-200">
                    {event.type === 'note'
                      ? `${event.note}${event.octave} · ${INSTRUMENTS[event.instrument].label}`
                      : `${DRUMS[event.drumKey].label}`}
                  </span>
                  <span className="text-slate-500 font-mono">{event.time.toFixed(2)}s</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
        <h2 className="text-sm uppercase tracking-wide text-slate-400 mb-4">Rhythm Pads</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {drumList.map(([key, drum]) => (
            <button
              key={key}
              onClick={() => handleDrumClick(key)}
              className="h-28 rounded-2xl border border-slate-700 bg-slate-950/60 text-lg font-semibold flex items-center justify-center text-slate-200 hover:border-pink-500 hover:text-pink-200 transition"
            >
              {drum.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
