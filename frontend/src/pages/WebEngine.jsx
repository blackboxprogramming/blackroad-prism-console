import React, { useRef, useState } from 'react'
import './WebEngine.css'

const MODES = ['Search', 'Analyze', 'Create']

const RESULT_TABS = [
  { key: 'ai', label: 'AI Answer', icon: '🤖' },
  { key: 'web', label: 'Web Results', icon: '🌐' },
  { key: 'visual', label: 'Visual', icon: '🖼️' },
  { key: 'data', label: 'Data', icon: '📊' },
  { key: 'maps', label: 'Maps', icon: '🗺️' },
  { key: 'news', label: 'News', icon: '📰' },
]

const QUICK_ACTIONS = [
  { icon: '🌐', label: 'Web Search', query: 'Latest AI developments in 2025' },
  { icon: '📊', label: 'Analytics', query: 'AI adoption analytics dashboard' },
  { icon: '🗺️', label: 'Maps', query: 'Tech hubs near me' },
  { icon: '🖼️', label: 'Images', query: 'AI lab workspaces inspiration' },
  { icon: '📰', label: 'News', query: 'Breaking AI regulation updates' },
  { icon: '🎓', label: 'Research', query: 'Recent quantum computing breakthroughs' },
]

const HISTORY_ITEMS = [
  { query: 'Latest AI developments in 2025', time: '2 hours ago' },
  { query: 'Best restaurants near Times Square', time: 'Yesterday' },
  { query: 'Python data visualization libraries comparison', time: '2 days ago' },
]

const CAPABILITIES = [
  {
    icon: '🧠',
    title: 'AI-Powered Analysis',
    description: 'Deep understanding and synthesis of web content with multi-source verification',
  },
  {
    icon: '⚡',
    title: 'Real-Time Data',
    description: 'Live web scraping, API integration, and instant data updates',
  },
  {
    icon: '🎨',
    title: 'Visual Intelligence',
    description: 'Image recognition, chart generation, and data visualization',
  },
]

const EXAMPLE_QUERIES = [
  {
    icon: '📊',
    title: 'Analyze & Compare',
    text: 'Compare the top 5 AI models released in 2025, their capabilities, and performance benchmarks',
  },
  {
    icon: '🌍',
    title: 'Real-Time Intelligence',
    text: "What's happening in global tech markets right now? Show me trends and breaking news",
  },
  {
    icon: '🔬',
    title: 'Deep Research',
    text: 'Research quantum computing breakthroughs, extract key findings, and visualize progress',
  },
  {
    icon: '🗺️',
    title: 'Location Intelligence',
    text: 'Find the best co-working spaces in San Francisco with amenities, pricing, and reviews',
  },
  {
    icon: '💼',
    title: 'Business Insights',
    text: 'Analyze startup funding trends in AI sector for Q1 2025 with investment patterns',
  },
  {
    icon: '🎯',
    title: 'Multi-Source Synthesis',
    text: 'Synthesize expert opinions on remote work future from top tech publications',
  },
]

const WEB_RESULTS = [
  {
    domain: 'techcrunch.com',
    title: 'Breaking: New AI Model Achieves 95% Efficiency Gains in 2025',
    snippet:
      'Researchers at leading AI labs have unveiled a groundbreaking model architecture that achieves unprecedented efficiency. The new approach reduces training costs by 95% while maintaining state-of-the-art performance across benchmarks... ',
    meta: ['⏰ 3 hours ago', '📖 5 min read', '⚡ High relevance'],
  },
  {
    domain: 'mit.edu',
    title: 'MIT Researchers Publish Comprehensive AI Alignment Study',
    snippet:
      "A new paper from MIT's CSAIL lab presents breakthrough findings in AI safety and alignment. The research demonstrates practical methods for ensuring AI systems remain aligned with human values even as they become more capable...",
    meta: ['⏰ 1 day ago', '📖 12 min read', '🎓 Academic'],
  },
  {
    domain: 'nature.com',
    title: 'Multi-Modal AI Systems: The Next Frontier in Machine Learning',
    snippet:
      'Nature AI publishes extensive research showing how integrated multi-modal systems outperform specialized single-domain models. The findings suggest a paradigm shift in how we approach AI development and deployment... ',
    meta: ['⏰ 2 days ago', '📖 15 min read', '🔬 Research'],
  },
]

const VISUAL_ITEMS = [
  { title: 'AI Model Efficiency Gains 2020-2025' },
  { title: 'Multi-Modal Architecture Overview' },
  { title: 'Enterprise AI Adoption Heatmap' },
  { title: 'AI Safety Research Landscape' },
]

const LOCATIONS = [
  {
    name: 'NeuroLabs Innovation Hub',
    address: '221B Quantum Way, San Francisco, CA',
    details: ['⭐ 4.8 rating', '💼 Enterprise ready', '🕒 Open 24/7'],
  },
  {
    name: 'Synapse Co-Lab',
    address: '84 Neural Drive, San Francisco, CA',
    details: ['⭐ 4.6 rating', '🚀 Startup focused', '☕ Premium amenities'],
  },
]

const RELATED_QUERIES = [
  'Future of AI in healthcare',
  'AI model comparison 2025',
  'Open source AI projects',
  'AI ethics and regulation',
  'Machine learning frameworks',
]

const TRENDING_TOPICS = [
  { label: '#1 Trending', value: 'AI Model Efficiency' },
  { label: '#2 Trending', value: 'Multi-Modal Systems' },
  { label: '#3 Trending', value: 'AI Safety Research' },
]

const INFO_STATS = [
  { label: 'Confidence Score', value: '94% High Confidence' },
  { label: 'Sources Analyzed', value: '47 web sources' },
  { label: 'Last Updated', value: 'Real-time (3 min ago)' },
  { label: 'Content Type', value: 'News, Research, Analysis' },
]

const SOURCE_CHIPS = ['TechCrunch', 'MIT Technology Review', 'Nature AI', 'ArXiv Papers', '+12 more sources']

const RESULTS_META = ['🔍 Sources: 47', '⚡ Analysis time: 2.3s', '🌐 Web + AI synthesis']

export default function WebEngine(){
  const [searchInput, setSearchInput] = useState('')
  const [activeQuery, setActiveQuery] = useState('Latest developments in artificial intelligence')
  const [view, setView] = useState('landing')
  const [activeMode, setActiveMode] = useState(MODES[0])
  const [activeTab, setActiveTab] = useState(RESULT_TABS[0].key)
  const resultsContentRef = useRef(null)

  const isResultsView = view === 'results'

  function handleSearch(value){
    const query = (value ?? searchInput).trim()
    if(!query){
      return
    }
    setActiveQuery(query)
    setSearchInput(query)
    setView('results')
    setActiveTab('ai')
    requestAnimationFrame(()=>{
      if(resultsContentRef.current){
        resultsContentRef.current.scrollTo({ top: 0, behavior: 'smooth' })
      }
    })
  }

  function handleSubmit(event){
    event.preventDefault()
    handleSearch()
  }

  function handleExampleClick(text){
    setSearchInput(text)
    handleSearch(text)
  }

  return (
    <div className="col-span-12 -mx-6 -my-4">
      <div className="web-engine">
        <header className="header">
          <div className="logo">
            <div className="logo-icon">∞</div>
            <div className="logo-text">
              <div className="logo-title">BlackRoad Infinity</div>
              <div className="logo-subtitle">WEB INTELLIGENCE</div>
            </div>
          </div>

          <div className="header-center">
            <form className="search-container" onSubmit={handleSubmit}>
              <input
                type="text"
                className="main-search"
                placeholder="Search the web, analyze data, generate insights..."
                value={searchInput}
                onChange={event=>setSearchInput(event.target.value)}
              />
              <button type="submit" className="search-button" aria-label="Search">
                🔍
              </button>
            </form>
          </div>

          <div className="header-right">
            <div className="mode-toggle">
              {MODES.map(mode=>(
                <button
                  key={mode}
                  type="button"
                  className={`mode-btn ${activeMode === mode ? 'active' : ''}`}
                  onClick={()=>setActiveMode(mode)}
                >
                  {mode}
                </button>
              ))}
            </div>
            <button type="button" className="header-icon-btn" aria-label="Settings">⚙️</button>
            <button type="button" className="header-icon-btn" aria-label="Profile">👤</button>
          </div>
        </header>

        <div className="main-container">
          <aside className="sidebar-left">
            <div className="sidebar-header">
              <div className="sidebar-title">Quick Actions</div>
              <div className="quick-actions">
                {QUICK_ACTIONS.map(action=>(
                  <button
                    key={action.label}
                    type="button"
                    className="quick-action"
                    onClick={()=>handleSearch(action.query)}
                  >
                    <div className="quick-action-icon">{action.icon}</div>
                    <div className="quick-action-label">{action.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="sidebar-content">
              <div className="history-section">
                <div className="sidebar-title">Recent Searches</div>
                {HISTORY_ITEMS.map(item=>(
                  <button
                    key={item.query}
                    type="button"
                    className="history-item"
                    onClick={()=>handleSearch(item.query)}
                  >
                    <div className="history-query">{item.query}</div>
                    <div className="history-time">{item.time}</div>
                  </button>
                ))}
              </div>

              <div className="sidebar-title">Capabilities</div>
              {CAPABILITIES.map(capability=>(
                <div key={capability.title} className="capability-card">
                  <div className="capability-icon">{capability.icon}</div>
                  <div className="capability-title">{capability.title}</div>
                  <div className="capability-desc">{capability.description}</div>
                </div>
              ))}
            </div>
          </aside>

          <main className="content-area">
            {view === 'landing' && (
              <div className="landing-view">
                <div className="landing-hero">
                  <div className="hero-icon">∞</div>
                  <h1 className="hero-title">Beyond Search.<br/>Total Intelligence.</h1>
                  <p className="hero-subtitle">
                    Harness the full power of the web with AI-driven analysis, real-time data synthesis,
                    and multi-modal intelligence that goes far beyond traditional search.
                  </p>
                </div>

                <div className="example-queries">
                  {EXAMPLE_QUERIES.map(example=>(
                    <button
                      key={example.title}
                      type="button"
                      className="example-card"
                      onClick={()=>handleExampleClick(example.text)}
                    >
                      <div className="example-icon">{example.icon}</div>
                      <div className="example-title">{example.title}</div>
                      <div className="example-text">"{example.text}"</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isResultsView && (
              <div className="results-view">
                <div className="results-header">
                  <div className="query-display">{activeQuery}</div>
                  <div className="results-meta">
                    {RESULTS_META.map(item=>(
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                </div>

                <div className="results-tabs">
                  {RESULT_TABS.map(tab=>(
                    <button
                      key={tab.key}
                      type="button"
                      className={`result-tab ${activeTab === tab.key ? 'active' : ''}`}
                      onClick={()=>setActiveTab(tab.key)}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>

                <div className="results-content" ref={resultsContentRef}>
                  {activeTab === 'ai' && (
                    <div className="answer-card">
                      <div className="answer-header">
                        <div className="ai-badge">
                          <span>∞</span>
                          <span>AI-Synthesized Answer</span>
                        </div>
                      </div>
                      <div className="answer-text">
                        <p>
                          <strong>Artificial intelligence is experiencing rapid advancement in 2025</strong>, with several
                          breakthrough developments across multiple domains. The field has seen transformative progress in
                          large language models, with new architectures achieving better reasoning capabilities while
                          requiring less computational power.
                        </p>
                        <p>
                          <strong>Key developments include:</strong> Multi-modal AI systems that seamlessly integrate text, images,
                          audio, and video processing; improved efficiency in model training through novel optimization
                          techniques; advances in AI safety and alignment research; and practical deployment of AI agents in
                          enterprise environments.
                        </p>
                        <p>
                          The focus has shifted toward creating more capable, efficient, and safe AI systems that can be
                          deployed at scale. Research institutions and companies are collaborating on open-source initiatives,
                          leading to faster innovation cycles and broader accessibility of advanced AI capabilities.
                        </p>
                      </div>
                      <div className="answer-sources">
                        {SOURCE_CHIPS.map(source=>(
                          <div key={source} className="source-chip">
                            <span>📄</span>
                            <span>{source}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'web' && (
                    <div className="results-list">
                      {WEB_RESULTS.map(result=>(
                        <article key={result.title} className="web-result">
                          <div className="result-url">
                            <div className="result-favicon" />
                            <span className="result-domain">{result.domain}</span>
                          </div>
                          <h3 className="result-title">{result.title}</h3>
                          <p className="result-snippet">{result.snippet}</p>
                          <div className="result-meta">
                            {result.meta.map(meta=> (
                              <span key={meta}>{meta}</span>
                            ))}
                          </div>
                        </article>
                      ))}
                    </div>
                  )}

                  {activeTab === 'visual' && (
                    <div className="visual-grid">
                      {VISUAL_ITEMS.map(item=>(
                        <div key={item.title} className="visual-item">
                          <div className="visual-thumb" />
                          <div className="visual-info">
                            <div className="visual-title">{item.title}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'data' && (
                    <div className="chart-container">
                      <div className="chart-title">📊 AI Model Performance Trends (2020-2025)</div>
                      <div className="chart-placeholder">📈 Interactive Chart Visualization</div>
                    </div>
                  )}

                  {activeTab === 'maps' && (
                    <div className="location-list">
                      <div className="map-container">
                        <div className="map-placeholder">🗺️</div>
                      </div>
                      {LOCATIONS.map(location=>(
                        <article key={location.name} className="location-card">
                          <div className="location-image" />
                          <div className="location-info">
                            <div className="location-name">{location.name}</div>
                            <div className="location-address">{location.address}</div>
                            <div className="location-details">
                              {location.details.map(detail=>(
                                <span key={detail}>{detail}</span>
                              ))}
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}

                  {activeTab === 'news' && (
                    <div className="results-list">
                      {WEB_RESULTS.map(result=>(
                        <article key={`news-${result.title}`} className="web-result">
                          <div className="result-url">
                            <div className="result-favicon" />
                            <span className="result-domain">{result.domain}</span>
                          </div>
                          <h3 className="result-title">{result.title}</h3>
                          <p className="result-snippet">{result.snippet}</p>
                          <div className="result-meta">
                            {result.meta.map(meta=>(
                              <span key={`news-${result.title}-${meta}`}>{meta}</span>
                            ))}
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>

          {isResultsView && (
            <aside className="sidebar-right">
              <div className="info-panel">
                <div className="info-title">Search Intelligence</div>
                {INFO_STATS.map(stat=>(
                  <div key={stat.label} className="info-item">
                    <div className="info-label">{stat.label}</div>
                    <div className="info-value">{stat.value}</div>
                  </div>
                ))}
              </div>

              <div className="info-panel">
                <div className="info-title">Related Queries</div>
                {RELATED_QUERIES.map(query=>(
                  <button
                    key={query}
                    type="button"
                    className="related-query"
                    onClick={()=>handleSearch(query)}
                  >
                    {query}
                  </button>
                ))}
              </div>

              <div className="info-panel">
                <div className="info-title">Trending Topics</div>
                {TRENDING_TOPICS.map(topic=>(
                  <div key={topic.label} className="info-item">
                    <div className="info-label">{topic.label}</div>
                    <div className="info-value">{topic.value}</div>
                  </div>
                ))}
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}
