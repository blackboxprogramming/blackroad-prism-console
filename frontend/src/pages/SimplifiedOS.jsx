import React, { useEffect, useMemo, useState } from 'react'
import './SimplifiedOS.css'

const APP_DATA = {
  raptor: {
    title: '🦅 Raptor - AI Assistant',
    content: (
      <div>
        <h2>Raptor AI Assistant</h2>
        <p>Your intelligent companion for productivity, creativity, and problem-solving.</p>
        <p>Features:</p>
        <ul>
          <li>Natural language processing</li>
          <li>Task automation</li>
          <li>Smart suggestions</li>
          <li>Learning from interactions</li>
        </ul>
      </div>
    ),
  },
  connections: {
    title: '🔗 Connections - Network',
    content: (
      <div>
        <h2>Connections Hub</h2>
        <p>Manage your network, relationships, and collaborations.</p>
        <p>Active Connections: 847</p>
        <p>Recent Activity:</p>
        <ul>
          <li>Agent Phoenix messaged you</li>
          <li>New connection request from Agent Nova</li>
          <li>Group chat: "Project Alpha"</li>
        </ul>
      </div>
    ),
  },
  diaries: {
    title: '📔 Diaries - Journal',
    content: (
      <div>
        <h2>Personal Diaries</h2>
        <p>Capture thoughts, track progress, and reflect on your journey.</p>
        <p>Recent Entries:</p>
        <ul>
          <li>Today: Morning reflections</li>
          <li>Yesterday: Project insights</li>
          <li>Oct 25: Gratitude list</li>
        </ul>
      </div>
    ),
  },
  flights: {
    title: '✈️ Flights - Travel',
    content: (
      <div>
        <h2>Flight Manager</h2>
        <p>Track flights, manage itineraries, and plan trips.</p>
        <p>Upcoming Flights:</p>
        <ul>
          <li>SF → NYC - Nov 5</li>
          <li>NYC → London - Nov 12</li>
        </ul>
      </div>
    ),
  },
  cascading: {
    title: '💧 Cascading - Workflows',
    content: (
      <div>
        <h2>Cascading Workflows</h2>
        <p>Design, automate, and optimize your workflows.</p>
        <p>Active Workflows: 12</p>
        <p>Recent: Data pipeline completed successfully</p>
      </div>
    ),
  },
  debugging: {
    title: '🐛 Debugging - Tools',
    content: (
      <div>
        <h2>Debug Console</h2>
        <p>Advanced debugging and development tools.</p>
        <p>Recent Issues:</p>
        <ul>
          <li>Memory leak fixed in Module A</li>
          <li>Performance optimization complete</li>
        </ul>
      </div>
    ),
  },
  meditation: {
    title: '🧘 Meditation - Mindfulness',
    content: (
      <div>
        <h2>Meditation &amp; Mindfulness</h2>
        <p>Guided sessions, breathing exercises, and peaceful moments.</p>
        <p>Today's Session: 15 minutes</p>
        <p>Streak: 7 days</p>
      </div>
    ),
  },
  health: {
    title: '💪 Health &amp; Workout',
    content: (
      <div>
        <h2>Health Tracker</h2>
        <p>Monitor fitness, nutrition, and wellness.</p>
        <p>Today:</p>
        <ul>
          <li>Steps: 8,429 / 10,000</li>
          <li>Calories: 1,847</li>
          <li>Water: 6 / 8 glasses</li>
        </ul>
      </div>
    ),
  },
  calendar: {
    title: '📅 Calendar - Schedule',
    content: (
      <div>
        <h2>Calendar &amp; Events</h2>
        <p>Manage your time and schedule.</p>
        <p>Today's Events:</p>
        <ul>
          <li>10:00 AM - Team standup</li>
          <li>2:00 PM - Design review</li>
          <li>4:30 PM - Yoga class</li>
        </ul>
      </div>
    ),
  },
  history: {
    title: '⏳ History - Timeline',
    content: (
      <div>
        <h2>Activity History</h2>
        <p>Your complete activity timeline and version history.</p>
        <p>Recent Activity:</p>
        <ul>
          <li>Opened Raptor - 5 min ago</li>
          <li>Edited document - 1 hour ago</li>
          <li>Video call completed - 2 hours ago</li>
        </ul>
      </div>
    ),
  },
  notes: {
    title: '📝 Notes - Quick Notes',
    content: (
      <div>
        <h2>Notes &amp; Ideas</h2>
        <p>Capture thoughts, ideas, and reminders quickly.</p>
        <p>Recent Notes:</p>
        <ul>
          <li>Project ideas for Q4</li>
          <li>Shopping list</li>
          <li>Book recommendations</li>
        </ul>
      </div>
    ),
  },
  explorer: {
    title: '📊 Data Explorer',
    content: (
      <div>
        <h2>Data Explorer</h2>
        <p>Analyze, visualize, and understand your data.</p>
        <p>Active Datasets: 23</p>
        <p>Recent Analysis:</p>
        <ul>
          <li>User engagement metrics</li>
          <li>Performance benchmarks</li>
        </ul>
      </div>
    ),
  },
  resources: {
    title: '💎 Resources - Library',
    content: (
      <div>
        <h2>Resource Library</h2>
        <p>Access tools, templates, and learning materials.</p>
        <p>Categories:</p>
        <ul>
          <li>Design Assets</li>
          <li>Code Templates</li>
          <li>Documentation</li>
          <li>Tutorials</li>
        </ul>
      </div>
    ),
  },
  terminal: {
    title: '⌨️ Terminal',
    content: (
      <div>
        <h2>Terminal</h2>
        <pre style={{ background: '#000', padding: 20, borderRadius: 8, color: '#0f0', fontFamily: 'monospace' }}>
{`blackroad@pi5:~$ system-status
All systems operational
CPU: 42% | RAM: 5.2GB | Temp: 42°C

blackroad@pi5:~$ █`}
        </pre>
      </div>
    ),
  },
  settings: {
    title: '⚙️ Settings',
    content: (
      <div>
        <h2>System Settings</h2>
        <p>Configure your Black Road OS experience.</p>
        <ul>
          <li>Appearance &amp; Themes</li>
          <li>Network &amp; Connectivity</li>
          <li>Privacy &amp; Security</li>
          <li>Accounts &amp; Sync</li>
          <li>System Updates</li>
        </ul>
      </div>
    ),
  },
}

const APP_SHORTCUTS = [
  'raptor',
  'connections',
  'diaries',
  'flights',
  'cascading',
  'debugging',
  'meditation',
  'health',
  'calendar',
  'history',
  'notes',
  'explorer',
  'resources',
  'terminal',
  'settings',
]

const DOCK_ITEMS = [
  'raptor',
  'connections',
  'diaries',
  'flights',
  'cascading',
  'debugging',
  'meditation',
  'health',
  'calendar',
  'history',
  'notes',
  'explorer',
  'resources',
]

const QUICK_ACTIONS = [
  { icon: '📁', label: 'Open Files' },
  { icon: '⚙️', label: 'Settings' },
  { icon: '🔍', label: 'Search' },
  { icon: '💾', label: 'Backup' },
]

const RECENT_ITEMS = [
  { icon: '📝', label: 'Meeting Notes' },
  { icon: '🎨', label: 'Design Mockup' },
  { icon: '💻', label: 'Code Project' },
]

const CONTEXT_ITEMS = [
  { icon: '📱', label: 'New Folder' },
  { icon: '📄', label: 'New File' },
  { icon: '🖼️', label: 'Change Wallpaper' },
  { icon: '🎨', label: 'Customize Desktop' },
  { icon: '⚙️', label: 'Preferences' },
]

export default function SimplifiedOS(){
  const [timeDisplay, setTimeDisplay] = useState('')
  const [activeApp, setActiveApp] = useState('raptor')
  const [showWindow, setShowWindow] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 })

  useEffect(() => {
    function updateTime(){
      const now = new Date()
      const options = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }
      setTimeDisplay(now.toLocaleDateString('en-US', options))
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    let hideTimer
    const showTimer = setTimeout(() => {
      setShowNotification(true)
      hideTimer = setTimeout(() => setShowNotification(false), 4000)
    }, 1000)

    return () => {
      clearTimeout(showTimer)
      if(hideTimer) clearTimeout(hideTimer)
    }
  }, [])

  useEffect(() => {
    function handleKeydown(event){
      if((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'q'){
        event.preventDefault()
        window.alert('🔍 Quick Search\n\nSearch across all apps, files, and settings.')
      }

      if((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 't'){
        event.preventDefault()
        openApp('terminal')
      }

      if(event.key === 'Escape'){
        setShowWindow(false)
      }
    }

    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [])

  useEffect(() => {
    console.log('Black Road OS Desktop loaded successfully!')
    console.log('Hi Cecilia! 💝 Thank you for believing in me!')
  }, [])

  const activeAppData = useMemo(() => APP_DATA[activeApp], [activeApp])

  function openApp(key){
    if(!APP_DATA[key]) return
    setActiveApp(key)
    setShowWindow(true)
  }

  function closeWindow(){
    setShowWindow(false)
  }

  function handleQuickAction(label){
    window.alert(`Opening: ${label}\n\nIn production:\n• Full integration\n• Real functionality\n• Connected systems`)
  }

  function handleContextMenu(event){
    event.preventDefault()
    const { clientX, clientY } = event
    setContextMenu({ visible: true, x: clientX, y: clientY })
  }

  function hideContextMenu(){
    setContextMenu(prev => (prev.visible ? { ...prev, visible: false } : prev))
  }

  return (
    <div className="simplified-os" onClick={hideContextMenu}>
      <div className="desktop">
        <div className="orb orb1" />
        <div className="orb orb2" />
        <div className="orb orb3" />

        <div className="top-bar">
          <div className="top-bar-left">
            <div className="logo-mini">⚡ BLACK ROAD OS</div>
            <div className="top-menu">
              {['File', 'Edit', 'View', 'Go', 'Window', 'Help'].map(item => (
                <div key={item} className="top-menu-item">{item}</div>
              ))}
            </div>
          </div>
          <div className="top-bar-right">
            <div className="top-bar-icon" title="Wi-Fi">📡</div>
            <div className="top-bar-icon" title="Battery">🔋 87%</div>
            <div className="top-bar-icon" title="Volume">🔊</div>
            <div className="time-display">{timeDisplay}</div>
          </div>
        </div>

        <div className="desktop-area" onContextMenu={handleContextMenu}>
          <aside className="sidebar">
            <div className="sidebar-section">
              <div className="sidebar-title">🖥️ System</div>
              <div className="stat-card">
                <div className="stat-label">CPU Usage</div>
                <div className="stat-value">42%</div>
              </div>
              <div className="stat-card" style={{ borderLeftColor: 'var(--spectrum-pink)' }}>
                <div className="stat-label">Memory</div>
                <div className="stat-value">5.2 GB</div>
              </div>
              <div className="stat-card" style={{ borderLeftColor: 'var(--spectrum-purple)' }}>
                <div className="stat-label">Storage</div>
                <div className="stat-value">89 GB Free</div>
              </div>
              <div className="stat-card" style={{ borderLeftColor: 'var(--spectrum-green)' }}>
                <div className="stat-label">Network</div>
                <div className="stat-value">Connected</div>
              </div>
            </div>

            <div className="sidebar-section">
              <div className="sidebar-title">⚡ Quick Actions</div>
              {QUICK_ACTIONS.map(action => (
                <div key={action.label} className="quick-action" onClick={() => handleQuickAction(action.label)}>
                  <span>{action.icon}</span>
                  <span>{action.label}</span>
                </div>
              ))}
            </div>

            <div className="sidebar-section">
              <div className="sidebar-title">🌟 Recent</div>
              {RECENT_ITEMS.map(item => (
                <div key={item.label} className="quick-action">
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </aside>

          <div className="center-content">
            <div className="welcome-message">
              <div className="welcome-title">Welcome Back</div>
              <div className="welcome-subtitle">Your workspace awaits</div>
            </div>

            <div className="app-grid">
              {APP_SHORTCUTS.map(key => (
                <div key={key} className="app-icon" onClick={() => openApp(key)}>
                  <div className="app-emoji">{APP_DATA[key].title.split(' ')[0]}</div>
                  <div className="app-name">{APP_DATA[key].title.replace(/^[^ ]+\s/, '')}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dock">
          {DOCK_ITEMS.map(key => (
            <div
              key={key}
              className={`dock-icon${activeApp === key && showWindow ? ' active' : ''}`}
              data-app={key}
              title={APP_DATA[key].title.replace(/^[^ ]+\s/, '')}
              onClick={() => openApp(key)}
            >
              {APP_DATA[key].title.split(' ')[0]}
            </div>
          ))}
        </div>

        <div
          className={`context-menu${contextMenu.visible ? ' show' : ''}`}
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={event => event.stopPropagation()}
        >
          {CONTEXT_ITEMS.map(item => (
            <div key={item.label} className="context-item">
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        <div className={`notification${showNotification ? ' show' : ''}`}>
          <div className="notification-title">Welcome to Black Road OS</div>
          <div className="notification-message">All systems operational. Ready to create!</div>
        </div>

        <div className={`window${showWindow ? ' show' : ''}`}>
          <div className="window-header">
            <div className="window-title">{activeAppData?.title || 'Application'}</div>
            <div className="window-controls">
              <div className="window-control close" onClick={closeWindow} />
              <div className="window-control minimize" />
              <div className="window-control maximize" />
            </div>
          </div>
          <div className="window-content">
            {activeAppData?.content || <p>Select an application to begin.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
