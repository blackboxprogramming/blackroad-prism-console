import React, { useEffect, useMemo, useState } from 'react'
import './RoadChain.css'

const HASH_STREAMS = [
  '0x7a8f9e4b2c1d0a5f6e3b9c8d7a4e2f1b0c9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d',
  '0x4e2f1b0c9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d7a8f9e4b2c1d0a5f6e3b9c8d',
  '0x9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d7a8f9e4b2c1d0a5f6e3b9c8d7a4e2f1b0c9a8f7e6d5c4b3a2f',
  '0x1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f7a8f9e4b2c1d0a5f6e3b9c8d7a4e2f1b0c9a8f7e6d5c4b3a',
  '0x5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d7a8f9e4b2c1d0a5f6e3',
  '0xb9c8d7a4e2f1b0c9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d7a8f9e4b2c1d0a5',
]

const BLOCKS = [
  {
    number: 'Block #847,293',
    reward: '+0.0124 ₿',
    hash: '0x7a8f9e4b2c1d0a5f6e3b9c8d7a4e2f1b0c9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e',
    meta: ['⏱️ 2 minutes ago', '🔗 284 transactions', '⚡ Difficulty: 92.4T'],
  },
  {
    number: 'Block #847,287',
    reward: '+0.0118 ₿',
    hash: '0x4e2f1b0c9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2',
    meta: ['⏱️ 18 minutes ago', '🔗 317 transactions', '⚡ Difficulty: 92.3T'],
  },
  {
    number: 'Block #847,281',
    reward: '+0.0131 ₿',
    hash: '0x9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d7a8',
    meta: ['⏱️ 34 minutes ago', '🔗 299 transactions', '⚡ Difficulty: 92.3T'],
  },
  {
    number: 'Block #847,275',
    reward: '+0.0126 ₿',
    hash: '0x1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f7a8',
    meta: ['⏱️ 51 minutes ago', '🔗 342 transactions', '⚡ Difficulty: 92.2T'],
  },
]

const ACTIONS = [
  { icon: '📤', label: 'Send', variant: 'btn-primary' },
  { icon: '📥', label: 'Receive', variant: 'btn-secondary' },
  { icon: '🔄', label: 'Swap', variant: 'btn-secondary' },
]

const AI_FEATURES = [
  {
    icon: '⚡',
    title: 'Quantum Optimization',
    description:
      'AI solves complex computational problems to find blocks 40x faster than traditional mining.',
  },
  {
    icon: '🎯',
    title: 'Predictive Analysis',
    description: 'Machine learning predicts optimal mining targets and difficulty adjustments in real-time.',
  },
  {
    icon: '💡',
    title: 'Smart Resource Allocation',
    description: 'Dynamically allocates computing power to most profitable chains and algorithms automatically.',
  },
  {
    icon: '🔒',
    title: 'Zero-Knowledge Mining',
    description:
      'Validate blocks without revealing computational methods, maintaining competitive advantage.',
  },
  {
    icon: '♻️',
    title: 'Energy Optimization',
    description: 'AI reduces power consumption by 95% through intelligent problem-solving instead of brute force.',
  },
  {
    icon: '🌐',
    title: 'Multi-Chain Support',
    description: 'Mines Bitcoin, Ethereum, and other chains simultaneously with optimized algorithms for each.',
  },
]

export default function RoadChain() {
  const [balance, setBalance] = useState(2.847)
  const [hashRate, setHashRate] = useState(47.2)
  const [blocksFound, setBlocksFound] = useState(284)
  const [notification, setNotification] = useState('')

  useEffect(() => {
    const id = setInterval(() => {
      setBalance((prev) => parseFloat((prev + Math.random() * 0.0001).toFixed(4)))
    }, 5000)

    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setHashRate(45 + Math.random() * 5)
    }, 3000)

    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      if (Math.random() > 0.95) {
        setBlocksFound((prev) => prev + 1)
        setNotification(`🎉 Block Found! +0.01${(Math.random() * 0.01).toFixed(4)} ₿`)
      }
    }, 10000)

    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!notification) return undefined

    const timeout = setTimeout(() => setNotification(''), 3000)
    return () => clearTimeout(timeout)
  }, [notification])

  useEffect(() => {
    const handler = (event) => {
      if (event.key === 'Escape') {
        console.log('RoadChain: Quantum Mining Active')
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const balanceUsd = useMemo(() => {
    const usd = balance * 43750
    return usd.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }, [balance])

  const handleActionClick = (label) => {
    window.alert(
      `${label}\n\nIn production:\n• Open ${label.toLowerCase()} interface\n• Connect to RoadChain network\n• Process transaction securely\n• Confirm on blockchain`,
    )
  }

  const handleBlockClick = (block) => {
    window.alert(
      `${block.number}\n\nHash: ${block.hash}\n\nIn production:\n• View full block details\n• See all transactions\n• Explore block relationships\n• Verify on blockchain explorer`,
    )
  }

  return (
    <div className="roadchain-page">
      <div className="blockchain-background" aria-hidden="true">
        <div className="block-grid" />
        <div className="quantum-glow" />
        <div className="mining-particle" />
        <div className="mining-particle" />
        <div className="mining-particle" />
        <div className="mining-particle" />
        <div className="mining-particle" />
      </div>

      <header className="header">
        <div className="logo">
          <div className="logo-icon" role="presentation">
            💰
          </div>
          <div className="logo-text">
            <div className="logo-title">RoadChain</div>
            <div className="logo-subtitle">Quantum Mining Network</div>
          </div>
        </div>

        <div className="header-stats" aria-live="polite">
          <div className="stat-box">
            <div className="stat-label">Network Hash Rate</div>
            <div className="stat-value">847 TH/s</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Difficulty</div>
            <div className="stat-value">92.4T</div>
          </div>
          <div className="mining-status">
            <div className="status-pulse" aria-hidden="true" />
            <span>AI Mining Active</span>
          </div>
        </div>
      </header>

      <div className="main-container">
        <main className="content-area">
          <section className="hero-section">
            <div className="balance-card">
              <div className="balance-label">Total Balance</div>
              <div className="balance-amount">₿ {balance.toFixed(4)}</div>
              <div className="balance-usd">≈ ${balanceUsd} USD</div>
              <div className="balance-change">
                <span aria-hidden="true">↑</span>
                <span>+18.7% this week</span>
              </div>

              <div className="action-buttons">
                {ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    className={`btn-action ${action.variant}`}
                    onClick={() => handleActionClick(action.label)}
                  >
                    <span aria-hidden="true">{action.icon}</span>
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mining-card">
              <div className="mining-icon" aria-hidden="true">
                ⚡
              </div>
              <div className="mining-metric">
                <div className="metric-label">Mining Speed</div>
                <div className="metric-value">{hashRate.toFixed(1)} TH/s</div>
              </div>
              <div className="mining-metric">
                <div className="metric-label">Blocks Found</div>
                <div className="metric-value">{blocksFound}</div>
              </div>
            </div>
          </section>

          <section className="mining-viz-section">
            <div className="viz-header">
              <div className="viz-title">
                <span aria-hidden="true">🔮</span>
                <span>Quantum Mining Visualization</span>
              </div>
            </div>

            <div className="mining-canvas">
              {HASH_STREAMS.map((stream, index) => (
                <div key={stream} className="hash-stream" style={{ top: `${10 + index * 15}%` }}>
                  {stream}
                </div>
              ))}
              <div className="block-found">⛏️ BLOCK FOUND! +0.0124 ₿</div>
            </div>

            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-card-label">Hashes Computed</div>
                <div className="metric-card-value">47.2M</div>
                <div className="metric-card-change">
                  <span aria-hidden="true">↑</span>
                  <span>+12% from yesterday</span>
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-card-label">Power Efficiency</div>
                <div className="metric-card-value">98.7%</div>
                <div className="metric-card-change">
                  <span aria-hidden="true">↑</span>
                  <span>AI optimized</span>
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-card-label">Success Rate</div>
                <div className="metric-card-value">94.2%</div>
                <div className="metric-card-change">
                  <span aria-hidden="true">↑</span>
                  <span>Above network avg</span>
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-card-label">Earnings/Day</div>
                <div className="metric-card-value">₿0.087</div>
                <div className="metric-card-change">
                  <span aria-hidden="true">↑</span>
                  <span>≈ $3,812.40 USD</span>
                </div>
              </div>
            </div>
          </section>

          <section className="ai-panel">
            <div className="ai-header">
              <div className="ai-icon" aria-hidden="true">
                🧠
              </div>
              <div>
                <div className="ai-title">Quantum AI Intelligence</div>
                <div className="ai-subtitle">Advanced problem-solving algorithms for efficient mining</div>
              </div>
            </div>

            <div className="ai-features">
              {AI_FEATURES.map((feature) => (
                <div key={feature.title} className="ai-feature">
                  <div className="feature-icon" aria-hidden="true">
                    {feature.icon}
                  </div>
                  <div className="feature-title">{feature.title}</div>
                  <div className="feature-desc">{feature.description}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="blocks-section">
            <div className="blocks-title">⛓️ Recently Mined Blocks</div>
            {BLOCKS.map((block) => (
              <div
                key={block.hash}
                className="block-item"
                onClick={() => handleBlockClick(block)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    handleBlockClick(block)
                  }
                }}
              >
                <div className="block-header">
                  <div className="block-number">{block.number}</div>
                  <div className="block-reward">{block.reward}</div>
                </div>
                <div className="block-hash">{block.hash}</div>
                <div className="block-meta">
                  {block.meta.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </div>
            ))}
          </section>
        </main>
      </div>

      {notification && <div className="notification-toast">{notification}</div>}
    </div>
  )
}
