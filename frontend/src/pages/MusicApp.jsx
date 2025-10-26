import React, { useEffect, useMemo, useState } from 'react'
import './MusicApp.css'

const STYLE_OPTIONS = [
  '🔥 Hip-Hop',
  '🎸 Rock',
  '💫 Electronic',
  '🎹 Classical',
  '🌊 Ambient',
  '🎺 Jazz',
  '🎤 Pop',
  '🎻 Cinematic',
]

const CREATION_METHODS = [
  {
    key: 'voice',
    icon: '🎤',
    title: 'Voice to Track',
    description:
      'Sing, rap, or speak your idea. AI turns your voice into a full production with instruments, harmony, and mixing.',
  },
  {
    key: 'hum',
    icon: '🎶',
    title: 'Hum to Music',
    description:
      'Just hum or whistle a melody. AI generates chords, rhythm, and full arrangement around your idea.',
  },
  {
    key: 'emotion',
    icon: '💭',
    title: 'Emotion Engine',
    description:
      'Tell us how you feel. AI creates music that matches your mood perfectly with zero effort.',
  },
  {
    key: 'reference',
    icon: '🎯',
    title: 'Reference Track',
    description:
      'Upload a song you love. AI analyzes the style and creates original music in that vibe.',
  },
]

const SLIDERS = [
  { key: 'energy', label: 'Energy', defaultValue: 75 },
  { key: 'tempo', label: 'Tempo', defaultValue: 60 },
  { key: 'complexity', label: 'Complexity', defaultValue: 50 },
  { key: 'emotion', label: 'Emotion', defaultValue: 80 },
]

const FEATURES = [
  { icon: '⚡', text: 'Instant generation' },
  { icon: '🎨', text: 'Full customization' },
  { icon: '💎', text: 'Studio quality' },
  { icon: '🌍', text: 'Royalty-free' },
]

const emotionOptions = [
  'Happy',
  'Sad',
  'Energetic',
  'Calm',
  'Angry',
  'Dreamy',
  'Nostalgic',
  'Epic',
]

export default function MusicApp(){
  const [trackDescription, setTrackDescription] = useState('')
  const [activeStyle, setActiveStyle] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(()=>{
    const previousTitle = document.title
    document.title = 'BlackRoad Sonic - Make Music Like a Legend'
    return ()=>{
      document.title = previousTitle
    }
  }, [])

  const waveBars = useMemo(()=>Array.from({ length: 20 }), [])

  function handleCreate(){
    const input = trackDescription.trim()
    if(!input){
      window.alert('💡 Describe your track or choose a creation method below!')
      return
    }

    window.alert(
      `🎵 Creating your track: "${input}"\n\nIn production, AI would:\n1. Analyze your description\n2. Generate melody, chords, rhythm\n3. Add instruments & effects\n4. Mix & master to studio quality\n\nYour track would be ready in ~30 seconds! 🚀`
    )
  }

  function handleMethodSelect(methodKey){
    switch(methodKey){
      case 'voice':
        setIsRecording(true)
        break
      case 'hum':
        window.alert('🎶 Hum to Music\n\nIn production:\n• Microphone captures your melody\n• AI detects pitch and rhythm\n• Generates chord progression\n• Adds drums, bass, and instruments\n• Creates full arrangement\n\nJust hum any melody and watch it become a masterpiece!')
        break
      case 'emotion':{
        const emotion = window.prompt(
          `💭 How are you feeling?\n\nChoose or type: ${emotionOptions.join(', ')}`
        )
        if(emotion){
          window.alert(`💭 Creating ${emotion} music!\n\n✨ AI is generating:\n• Emotional melody matching your mood\n• Appropriate tempo and energy\n• Matching instrumentation\n• Perfect atmosphere\n\nYour ${emotion} track is being created! 🎵`)
        }
        break
      }
      case 'reference':
        window.alert('🎯 Reference Track Mode\n\nIn production:\n• Upload any song you love\n• AI analyzes style, tempo, mood, structure\n• Creates NEW original music in that style\n• 100% unique and royalty-free\n\nLove Drake? Upload a Drake song and get original music in his style! 🔥')
        break
      default:
        break
    }
  }

  function handleExport(){
    window.alert('🎹 Export Options:\n\n• WAV (Uncompressed)\n• MP3 (High Quality)\n• FLAC (Lossless)\n• Stems (Individual tracks)\n• MIDI (For DAW import)\n\nChoose your format and download! 💎')
  }

  function handlePlaybackToggle(){
    setIsPlaying(prev => {
      const next = !prev
      if(next){
        window.alert('🎵 Playing your track! (In production, audio would play with full mixing)')
      }
      return next
    })
  }

  function handleSliderChange(label, value){
    console.log(`${label} adjusted to ${value}%`)
  }

  function stopRecording(){
    setIsRecording(false)
    window.alert('🎤 Voice recorded!\n\n✨ AI is now:\n• Analyzing your vocal patterns\n• Generating harmonies\n• Adding instruments\n• Creating full arrangement\n• Mixing to studio quality\n\nYour legendary track will be ready in 30 seconds! 🎹')
  }

  function cancelRecording(){
    setIsRecording(false)
  }

  return (
    <div className="music-app">
      <div className="music-sound-waves" aria-hidden="true">
        <div className="music-wave music-wave-1" />
        <div className="music-wave music-wave-2" />
        <div className="music-wave music-wave-3" />
      </div>

      <div className="music-app-inner">
        <header className="music-header">
          <div className="music-logo">
            <div className="music-logo-icon">🎵</div>
            <div className="music-logo-text">BlackRoad Sonic</div>
          </div>
          <div className="music-header-actions">
            <button type="button" className="music-btn-icon" title="Your Projects">📁</button>
            <button type="button" className="music-btn-icon" title="Collaborate">👥</button>
            <button type="button" className="music-btn-icon" title="Settings">⚙️</button>
            <button type="button" className="music-btn-export" onClick={handleExport}>
              Export Track 🎹
            </button>
          </div>
        </header>

        <div className="music-main-container">
          <div className="music-creation-zone">
            <div className="music-main-prompt">
              <h1 className="music-prompt-title">Make Music Like a Legend</h1>
              <p className="music-prompt-subtitle">
                No experience needed. Just describe your vibe, hum a melody, or feel the emotion.
                AI handles the rest. Sound like Drake, Hans Zimmer, or Daft Punk in seconds.
              </p>

              <div className="music-quick-input">
                <input
                  type="text"
                  className="music-input-box"
                  placeholder="Describe your track... 'Energetic hip-hop beat with space vibes' or just 'happy summer song'"
                  value={trackDescription}
                  onChange={event => setTrackDescription(event.target.value)}
                />
                <button type="button" className="music-magic-btn" onClick={handleCreate}>
                  ✨
                </button>
              </div>

              <div className="music-style-selector">
                {STYLE_OPTIONS.map(option => (
                  <button
                    type="button"
                    key={option}
                    className={`music-style-pill${activeStyle === option ? ' active' : ''}`}
                    onClick={()=> setActiveStyle(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="music-creation-methods">
              {CREATION_METHODS.map(method => (
                <button
                  type="button"
                  key={method.key}
                  className="music-method-card"
                  onClick={()=> handleMethodSelect(method.key)}
                >
                  <div className="music-method-icon">{method.icon}</div>
                  <h3 className="music-method-name">{method.title}</h3>
                  <p className="music-method-desc">{method.description}</p>
                </button>
              ))}
            </div>

            <div className="music-features">
              {FEATURES.map(feature => (
                <div key={feature.text} className="music-feature">
                  <span className="music-feature-icon">{feature.icon}</span>
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="music-control-panel">
            <div className="music-playback-controls">
              <button type="button" className="music-play-btn" onClick={handlePlaybackToggle}>
                {isPlaying ? '⏸️' : '▶️'}
              </button>
              <button type="button" className="music-control-btn">⏮️</button>
              <button type="button" className="music-control-btn">⏭️</button>
              <button type="button" className="music-control-btn">🔁</button>

              <div className="music-waveform" aria-hidden="true">
                {waveBars.map((_, index) => (
                  <div key={index} className="music-wave-bar" />
                ))}
              </div>

              <div className="music-time-display">0:00 / 3:24</div>
            </div>

            <div className="music-track-controls">
              {SLIDERS.map(slider => (
                <div key={slider.key} className="music-control-group">
                  <label className="music-control-label" htmlFor={`music-slider-${slider.key}`}>
                    {slider.label}
                  </label>
                  <input
                    id={`music-slider-${slider.key}`}
                    className="music-slider"
                    type="range"
                    min="0"
                    max="100"
                    defaultValue={slider.defaultValue}
                    onChange={event => handleSliderChange(slider.label, event.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isRecording && (
        <div className="music-modal">
          <div className="music-modal-content" role="dialog" aria-modal="true">
            <h2 className="music-modal-title">🎤 Recording Your Voice</h2>
            <div className="music-recording-indicator">🎙️</div>
            <p className="music-modal-text">
              Sing, rap, hum, or just talk about your idea.
              <br />
              AI is listening and will turn this into a full track...
            </p>
            <div className="music-modal-actions">
              <button type="button" className="music-btn-modal music-btn-modal-primary" onClick={stopRecording}>
                Stop &amp; Generate ✨
              </button>
              <button type="button" className="music-btn-modal music-btn-modal-secondary" onClick={cancelRecording}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
