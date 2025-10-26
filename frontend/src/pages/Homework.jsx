import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Homework.css'

const bubbleConfigs = [
  { left: '15%', top: '25%', delay: '-2s' },
  { left: '55%', top: '60%', delay: '-6s' },
  { left: '78%', top: '18%', delay: '-9s' },
  { left: '35%', top: '75%', delay: '-12s' },
]

const subjects = [
  { icon: '📐', name: 'Mathematics', progress: '24 problems solved' },
  { icon: '🧪', name: 'Chemistry', progress: '18 problems solved' },
  { icon: '⚡', name: 'Physics', progress: '31 problems solved' },
  { icon: '🌍', name: 'Geography', progress: '12 problems solved' },
  { icon: '📚', name: 'Literature', progress: '9 essays analyzed' },
  { icon: '💻', name: 'Computer Science', progress: '15 programs written' },
]

const quickActions = [
  { icon: '📝', name: 'Solve Problem', description: 'Step-by-step with visuals' },
  { icon: '🎬', name: 'Generate Video', description: 'Animated explanation' },
  { icon: '📊', name: 'Visualize Data', description: 'Interactive graphs' },
  { icon: '🧮', name: 'Formula Builder', description: 'Create equations' },
]

const steps = [
  {
    number: 1,
    title: 'Identify the Equation Type',
    description: 'This is a quadratic equation in standard form: ax² + bx + c = 0',
    formulas: ['2x² + 5x - 3 = 0'],
    footer: 'Where a = 2, b = 5, c = -3',
  },
  {
    number: 2,
    title: 'Apply the Quadratic Formula',
    description: 'Use the formula: x = (-b ± √(b² - 4ac)) / 2a',
    formulas: ['x = (-5 ± √(5² - 4(2)(-3))) / 2(2)'],
  },
  {
    number: 3,
    title: 'Calculate the Discriminant',
    description: 'The discriminant determines the nature of roots: b² - 4ac',
    formulas: ['5² - 4(2)(-3) = 25 + 24 = 49'],
    footer: 'Since 49 > 0, we have two real distinct roots.',
  },
  {
    number: 4,
    title: 'Solve for Both Roots',
    description: 'Substitute back into the formula:',
    formulas: ['x = (-5 ± √49) / 4 = (-5 ± 7) / 4', 'x₁ = 2/4 = 0.5   |   x₂ = -12/4 = -3'],
  },
  {
    number: 5,
    title: 'Verify the Solution',
    description: "Check both roots in the original equation to confirm they're correct. The graph shows the parabola crossing the x-axis at x = 0.5 and x = -3.",
  },
]

const recentProblems = [
  {
    icon: '📐',
    title: 'Solve: 2x² + 5x - 3 = 0',
    meta: 'Mathematics • Quadratic Equations • 15 min ago',
  },
  {
    icon: '🧪',
    title: 'Balance: H₂SO₄ + NaOH → Na₂SO₄ + H₂O',
    meta: 'Chemistry • Reactions • 1 hour ago',
  },
  {
    icon: '⚡',
    title: 'Calculate acceleration with F = ma',
    meta: "Physics • Newton's Laws • 2 hours ago",
  },
]

const controlButtons = [
  { id: 'play', label: '▶️', title: 'Play animation' },
  { id: 'pause', label: '⏸️', title: 'Pause animation' },
  { id: 'replay', label: '⟳', title: 'Replay animation' },
  { id: 'download', label: '📥', title: 'Download explanation' },
]

const questionPlaceholder = `Type any homework question...\nExamples:\n• Solve: 2x² + 5x - 3 = 0\n• Explain photosynthesis with diagrams\n• Why does ice float on water?\n• How do I integrate x³ + 2x?\n• Analyze the theme of Hamlet`

export default function Homework(){
  const [question, setQuestion] = useState('')
  const [showExplanation, setShowExplanation] = useState(false)
  const [activeControl, setActiveControl] = useState('play')
  const [animationKey, setAnimationKey] = useState(0)
  const explanationRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if(showExplanation && explanationRef.current){
      explanationRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [showExplanation])

  const handleVisualize = () => {
    setShowExplanation(true)
    setAnimationKey(prev => prev + 1)
  }

  const handleStepClick = (title) => {
    window.alert(
      `In production: This would expand with more details, show sub-steps, and animate the visualization to highlight the step: "${title}".`
    )
  }

  const handleActionCardClick = (name) => {
    window.alert(
      `🎬 ${name}\n\nIn production, this would:\n• Open specialized interface\n• Generate animated visuals\n• Show step-by-step reasoning\n• Create downloadable video explanation`
    )
  }

  const handleSubjectClick = (name) => {
    window.alert(
      `📚 Opening ${name}\n\nYou'll see:\n• Recent problems in this subject\n• Recommended practice\n• Video library for this topic\n• AI tutor specialized in ${name}`
    )
  }

  const handleProblemClick = (title) => {
    window.alert(
      `📘 Opening ${title}\n\nIn production, this would jump back into the full animated explanation, saved notes, and solution history.`
    )
  }

  return (
    <div className="col-span-12">
      <div className="homework-app">
        <div className="neural-background" aria-hidden="true">
          <div className="neural-grid" />
          {bubbleConfigs.map(bubble => (
            <div
              key={`${bubble.left}-${bubble.top}`}
              className="thought-bubble"
              style={{ left: bubble.left, top: bubble.top, animationDelay: bubble.delay }}
            />
          ))}
        </div>

        <header className="header">
          <div className="logo">
            <button
              type="button"
              className="logo-icon"
              onClick={() => navigate('/dashboard')}
            >
              🎓
            </button>
            <div className="logo-text">BlackRoad Scholar</div>
          </div>

          <nav className="header-nav">
            <button type="button" className="nav-tab active" onClick={() => navigate('/dashboard')}>
              Dashboard
            </button>
            <button type="button" className="nav-tab" onClick={() => window.alert('Coming soon: My Problems dashboard!')}>
              My Problems
            </button>
            <button type="button" className="nav-tab" onClick={() => window.alert('Coming soon: Video Library!')}>
              Video Library
            </button>
            <button type="button" className="nav-tab" onClick={() => window.alert('Coming soon: Study Guide!')}>
              Study Guide
            </button>
          </nav>

          <div className="user-info">
            <div className="streak-badge">
              <span role="img" aria-label="fire">🔥</span>
              <span>7 Day Streak</span>
            </div>
            <div className="avatar" aria-hidden="true">JS</div>
          </div>
        </header>

        <div className="main-container">
          <aside className="sidebar">
            <div className="sidebar-section">
              <div className="section-title">Subjects</div>
              {subjects.map(subject => (
                <button
                  key={subject.name}
                  type="button"
                  className="subject-item"
                  onClick={() => handleSubjectClick(subject.name)}
                >
                  <div className="subject-icon" aria-hidden="true">{subject.icon}</div>
                  <div className="subject-info">
                    <div className="subject-name">{subject.name}</div>
                    <div className="subject-progress">{subject.progress}</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="sidebar-section">
              <div className="section-title">Study Stats</div>
              <div className="study-stats">
                <div>📊 Problems Today: <strong>8</strong></div>
                <div>⏱️ Study Time: <strong>2h 45m</strong></div>
                <div>✅ Accuracy: <strong className="text-success">94%</strong></div>
                <div>🎯 Streak: <strong className="text-warning">7 days</strong></div>
              </div>
            </div>
          </aside>

          <main className="content-area">
            <div className="page-header">
              <h1 className="page-title">Visual Learning Dashboard</h1>
              <p className="page-subtitle">
                Ask any question and watch AI generate animated visual explanations. Like Desmos, but for every subject, every
                concept, every problem.
              </p>
            </div>

            <div className="quick-actions">
              {quickActions.map(action => (
                <button
                  key={action.name}
                  type="button"
                  className="action-card"
                  onClick={() => handleActionCardClick(action.name)}
                >
                  <div className="action-icon" aria-hidden="true">{action.icon}</div>
                  <div className="action-name">{action.name}</div>
                  <div className="action-desc">{action.description}</div>
                </button>
              ))}
            </div>

            <section className="question-input-section">
              <div className="input-label">
                <span role="img" aria-label="thought bubble">💭</span>
                <span>Ask Your Question</span>
              </div>
              <textarea
                className="question-textarea"
                placeholder={questionPlaceholder}
                value={question}
                onChange={event => setQuestion(event.target.value)}
              />
              <div className="input-actions">
                <button type="button" className="btn-primary" onClick={handleVisualize}>
                  <span role="img" aria-label="sparkles">✨</span>
                  <span>Visualize &amp; Solve</span>
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => window.alert('Upload via camera or gallery coming soon!')}
                >
                  📷 Upload Image
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => window.alert('Voice input coming soon!')}
                >
                  🎤 Voice Input
                </button>
              </div>
            </section>

            {showExplanation && (
              <section className="explanation-panel" ref={explanationRef}>
                <div className="explanation-header">
                  <div className="explanation-title">
                    <span role="img" aria-label="movie">🎬</span>
                    <span>Animated Visual Explanation</span>
                  </div>
                  <div className="viz-controls">
                    {controlButtons.map(button => (
                      <button
                        key={button.id}
                        type="button"
                        className={`control-btn ${activeControl === button.id ? 'active' : ''}`.trim()}
                        title={button.title}
                        onClick={() => setActiveControl(button.id)}
                      >
                        {button.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="animation-canvas">
                  <div className="graph-container">
                    <div className="axis axis-x" />
                    <div className="axis axis-y" />

                    <svg className="function-curve" viewBox="0 0 100 100" preserveAspectRatio="none" key={animationKey}>
                      <defs>
                        <linearGradient id={`gradient-${animationKey}`} x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#fdba2d" stopOpacity="1" />
                          <stop offset="20%" stopColor="#ff6b35" stopOpacity="1" />
                          <stop offset="40%" stopColor="#ff4fd8" stopOpacity="1" />
                          <stop offset="60%" stopColor="#c753ff" stopOpacity="1" />
                          <stop offset="80%" stopColor="#6366f1" stopOpacity="1" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="1" />
                        </linearGradient>
                      </defs>
                      <path className="curve-path" d="M 10,80 Q 30,20 50,50 T 90,30" stroke={`url(#gradient-${animationKey})`} />
                      <circle className="point" cx="50" cy="50" r="5" />
                    </svg>
                  </div>
                </div>

                <div className="steps-container">
                  {steps.map(step => (
                    <button
                      key={step.number}
                      type="button"
                      className="step"
                      onClick={() => handleStepClick(step.title)}
                    >
                      <div className="step-header">
                        <div className="step-number">{step.number}</div>
                        <div className="step-title">{step.title}</div>
                      </div>
                      <div className="step-content">
                        {step.description}
                        {step.formulas?.map(formula => (
                          <div key={formula} className="step-formula">
                            {formula}
                          </div>
                        ))}
                        {step.footer && <div className="step-footer">{step.footer}</div>}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section className="recent-section">
              <div className="recent-title">📚 Recent Problems</div>
              {recentProblems.map(problem => (
                <button key={problem.title} type="button" className="problem-item" onClick={() => handleProblemClick(problem.title)}>
                  <div className="problem-icon" aria-hidden="true">{problem.icon}</div>
                  <div className="problem-info">
                    <div className="problem-title">{problem.title}</div>
                    <div className="problem-meta">{problem.meta}</div>
                  </div>
                  <div className="problem-status">✓ Solved</div>
                </button>
              ))}
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}
