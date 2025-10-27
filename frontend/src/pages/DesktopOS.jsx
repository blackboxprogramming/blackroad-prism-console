import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './DesktopOS.css'

const DESKTOP_ICONS = [
  { app: 'raptor', label: 'Raptor', emoji: '🦅' },
  { app: 'connections', label: 'Connections', emoji: '🔗' },
  { app: 'diaries', label: 'Diaries', emoji: '📔' },
  { app: 'flights', label: 'Flights', emoji: '✈️' },
  { app: 'files', label: 'My Files', emoji: '📁' },
  { app: 'recycle', label: 'Recycle Bin', emoji: '🗑️' },
]

const PINNED_APPS = [
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
]

const TASKBAR_APPS = [
  { app: 'raptor', title: 'Raptor', emoji: '🦅' },
  { app: 'connections', title: 'Connections', emoji: '🔗' },
  { app: 'files', title: 'Files', emoji: '📁' },
  { app: 'terminal', title: 'Terminal', emoji: '⌨️' },
]

const RECENT_ITEMS = [
  { icon: '📝', name: 'Meeting Notes.txt', time: 'Opened 5 minutes ago' },
  { icon: '🎨', name: 'Design Mockup.fig', time: 'Edited 1 hour ago' },
  { icon: '💻', name: 'BlackRoad Project', time: 'Accessed 2 hours ago' },
]

const APP_CONTENT = {
  raptor: {
    title: '🦅 Raptor',
    body: (
      <>
        <h2>Raptor - AI Assistant</h2>
        <p>Your intelligent companion for productivity and creativity.</p>
        <ul>
          <li>Natural language processing</li>
          <li>Task automation</li>
          <li>Smart suggestions</li>
          <li>Context-aware responses</li>
        </ul>
      </>
    ),
  },
  connections: {
    title: '🔗 Connections',
    body: (
      <>
        <h2>Connections Network</h2>
        <p>Manage relationships and collaborations.</p>
        <p>
          <strong>Active Connections:</strong> 847
        </p>
        <ul>
          <li>Agent Phoenix online</li>
          <li>3 new messages</li>
          <li>2 pending requests</li>
        </ul>
      </>
    ),
  },
  diaries: {
    title: '📔 Diaries',
    body: (
      <>
        <h2>Personal Diaries</h2>
        <p>Capture thoughts and track your journey.</p>
        <ul>
          <li>Today: Morning reflections</li>
          <li>Yesterday: Project insights</li>
          <li>This week: 5 entries</li>
        </ul>
      </>
    ),
  },
  flights: {
    title: '✈️ Flights',
    body: (
      <>
        <h2>Flight Manager</h2>
        <p>Track and manage your travels.</p>
        <ul>
          <li>Next flight: SF → NYC (Nov 5)</li>
          <li>Upcoming: NYC → London (Nov 12)</li>
          <li>Miles earned: 47,842</li>
        </ul>
      </>
    ),
  },
  cascading: {
    title: '💧 Cascading',
    body: (
      <>
        <h2>Cascading Workflows</h2>
        <p>Design and automate your processes.</p>
        <ul>
          <li>12 active workflows</li>
          <li>Last run: Data pipeline (success)</li>
          <li>Average execution time: 2.3s</li>
        </ul>
      </>
    ),
  },
  debugging: {
    title: '🐛 Debugging',
    body: (
      <>
        <h2>Debug Console</h2>
        <p>Development and debugging tools.</p>
        <ul>
          <li>Memory leak fixed in Module A</li>
          <li>Performance: 23% improvement</li>
          <li>Active breakpoints: 3</li>
        </ul>
      </>
    ),
  },
  meditation: {
    title: '🧘 Meditation',
    body: (
      <>
        <h2>Meditation &amp; Mindfulness</h2>
        <p>Find peace and balance.</p>
        <ul>
          <li>Today's session: 15 minutes</li>
          <li>Current streak: 7 days</li>
          <li>Total time: 142 hours</li>
        </ul>
      </>
    ),
  },
  health: {
    title: '💪 Health',
    body: (
      <>
        <h2>Health &amp; Fitness</h2>
        <p>Track your wellness journey.</p>
        <ul>
          <li>Steps: 8,429 / 10,000</li>
          <li>Calories: 1,847 / 2,200</li>
          <li>Water: 6 / 8 glasses</li>
          <li>Sleep: 7.5 hours</li>
        </ul>
      </>
    ),
  },
  calendar: {
    title: '📅 Calendar',
    body: (
      <>
        <h2>Calendar &amp; Events</h2>
        <p>Manage your schedule.</p>
        <ul>
          <li>10:00 AM - Team standup</li>
          <li>2:00 PM - Design review</li>
          <li>4:30 PM - Yoga class</li>
        </ul>
      </>
    ),
  },
  history: {
    title: '⏳ History',
    body: (
      <>
        <h2>Activity History</h2>
        <p>Your complete timeline.</p>
        <ul>
          <li>Opened Raptor - 5 min ago</li>
          <li>Edited document - 1 hour ago</li>
          <li>Video call - 2 hours ago</li>
        </ul>
      </>
    ),
  },
  notes: {
    title: '📝 Notes',
    body: (
      <>
        <h2>Quick Notes</h2>
        <p>Capture ideas instantly.</p>
        <ul>
          <li>Project ideas for Q4</li>
          <li>Shopping list</li>
          <li>Book recommendations</li>
          <li>Code snippets</li>
        </ul>
      </>
    ),
  },
  explorer: {
    title: '📊 Data Explorer',
    body: (
      <>
        <h2>Data Explorer</h2>
        <p>Analyze and visualize data.</p>
        <ul>
          <li>23 active datasets</li>
          <li>User engagement metrics</li>
          <li>Performance benchmarks</li>
        </ul>
      </>
    ),
  },
  files: {
    title: '📁 File Explorer',
    body: (
      <>
        <h2>File Explorer</h2>
        <p>Browse and manage your files.</p>
        <ul>
          <li>Documents: 142 files</li>
          <li>Downloads: 23 files</li>
          <li>Pictures: 1,847 files</li>
          <li>Videos: 47 files</li>
        </ul>
      </>
    ),
  },
  terminal: {
    title: '⌨️ Terminal',
    body: (
      <>
        <h2>Terminal</h2>
        <pre className="terminal-output">
blackroad@pi5:~$ neofetch
Black Road OS 1.0.0
Kernel: 6.6.31-blackroad
Uptime: 2 hours, 14 mins
CPU: BCM2712 (4) @ 2.4GHz
Memory: 5234MB / 8192MB

blackroad@pi5:~$ █
        </pre>
      </>
    ),
  },
  settings: {
    title: '⚙️ Settings',
    body: (
      <>
        <h2>System Settings</h2>
        <p>Configure your system.</p>
        <ul>
          <li>Appearance &amp; Personalization</li>
          <li>Network &amp; Internet</li>
          <li>Privacy &amp; Security</li>
          <li>System &amp; Updates</li>
          <li>Apps &amp; Features</li>
        </ul>
      </>
    ),
  },
}

const APP_LABELS = {
  raptor: 'Raptor',
  connections: 'Connections',
  diaries: 'Diaries',
  flights: 'Flights',
  cascading: 'Cascading',
  debugging: 'Debugging',
  meditation: 'Meditation',
  health: 'Health',
  calendar: 'Calendar',
  history: 'History',
  notes: 'Notes',
  explorer: 'Data Explorer',
  files: 'File Explorer',
  terminal: 'Terminal',
  settings: 'Settings',
  recycle: 'Recycle Bin',
}

export default function DesktopOS(){
  const [startMenuOpen, setStartMenuOpen] = useState(false)
  const [selectedIcon, setSelectedIcon] = useState(null)
  const [windows, setWindows] = useState([])
  const [activeWindowId, setActiveWindowId] = useState(null)
  const [clock, setClock] = useState({ time: '', date: '' })

  const startMenuRef = useRef(null)
  const startButtonRef = useRef(null)
  const desktopRef = useRef(null)
  const stars = useMemo(
    () =>
      Array.from({ length: 100 }).map(() => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        delay: `${Math.random() * 3}s`,
      })),
    []
  )

  const windowIdRef = useRef(0)
  const topZIndexRef = useRef(6000)

  useEffect(() => {
    function updateClock(){
      const now = new Date()
      const time = now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
      const date = now.toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
      })
      setClock({ time, date })
    }

    updateClock()
    const interval = window.setInterval(updateClock, 1000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClickOutside(event){
      if(startMenuOpen){
        const target = event.target
        if(
          startMenuRef.current &&
          startButtonRef.current &&
          !startMenuRef.current.contains(target) &&
          !startButtonRef.current.contains(target)
        ){
          setStartMenuOpen(false)
        }
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [startMenuOpen])

  const makeWindowActive = useCallback((id) => {
    setWindows((prev) =>
      prev.map((window) =>
        window.id === id
          ? { ...window, zIndex: ++topZIndexRef.current, minimized: false }
          : window
      )
    )
    setActiveWindowId(id)
  }, [])

  const openWindow = useCallback((appName) => {
    const data = APP_CONTENT[appName]
    if(!data){
      return
    }

    setStartMenuOpen(false)

    setWindows((prev) => {
      const existing = prev.find((window) => window.app === appName)
      if(existing){
        const nextWindows = prev.map((window) =>
          window.id === existing.id
            ? {
                ...window,
                minimized: false,
                zIndex: ++topZIndexRef.current,
              }
            : window
        )
        setActiveWindowId(existing.id)
        return nextWindows
      }

      const id = `window-${++windowIdRef.current}`
      const offset = prev.length
      const nextWindow = {
        id,
        app: appName,
        title: data.title,
        minimized: false,
        maximized: false,
        zIndex: ++topZIndexRef.current,
        top: 100 + offset * 30,
        left: 200 + offset * 30,
      }
      setActiveWindowId(id)
      return [...prev, nextWindow]
    })
  }, [])

  const closeWindow = useCallback((id) => {
    setWindows((prev) => prev.filter((window) => window.id !== id))
    setActiveWindowId((current) => (current === id ? null : current))
  }, [])

  const minimizeWindow = useCallback((id) => {
    setWindows((prev) =>
      prev.map((window) =>
        window.id === id ? { ...window, minimized: true } : window
      )
    )
    setActiveWindowId((current) => (current === id ? null : current))
  }, [])

  const toggleMaximizeWindow = useCallback((id) => {
    setWindows((prev) =>
      prev.map((window) =>
        window.id === id
          ? {
              ...window,
              maximized: !window.maximized,
              zIndex: ++topZIndexRef.current,
            }
          : window
      )
    )
    setActiveWindowId(id)
  }, [])

  const handleTaskbarClick = useCallback(
    (appName) => {
      const targetWindow = windows.find((window) => window.app === appName)
      if(!targetWindow){
        openWindow(appName)
        return
      }

      if(targetWindow.minimized){
        makeWindowActive(targetWindow.id)
        setWindows((prev) =>
          prev.map((window) =>
            window.id === targetWindow.id
              ? { ...window, minimized: false }
              : window
          )
        )
        return
      }

      if(activeWindowId === targetWindow.id){
        minimizeWindow(targetWindow.id)
        return
      }

      makeWindowActive(targetWindow.id)
    },
    [activeWindowId, makeWindowActive, minimizeWindow, openWindow, windows]
  )

  const handleDesktopClick = useCallback((event) => {
    if(event.target === desktopRef.current){
      setSelectedIcon(null)
    }
  }, [])

  return (
    <div className="desktop-os">
      <div className="desktop" ref={desktopRef} onClick={handleDesktopClick}>
        <div className="stars" aria-hidden="true">
          {stars.map((star, index) => (
            <div
              key={index}
              className="star"
              style={{ left: star.left, top: star.top, animationDelay: star.delay }}
            />
          ))}
        </div>

        <div className="desktop-icons">
          {DESKTOP_ICONS.map((icon) => (
            <button
              key={icon.app}
              type="button"
              className={`desktop-icon${selectedIcon === icon.app ? ' selected' : ''}`}
              onClick={() => setSelectedIcon(icon.app)}
              onDoubleClick={() => openWindow(icon.app)}
            >
              <div className="desktop-icon-image" aria-hidden="true">
                {icon.emoji}
              </div>
              <div className="desktop-icon-label">{icon.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="taskbar">
        <button
          type="button"
          className="start-button"
          ref={startButtonRef}
          onClick={(event) => {
            event.stopPropagation()
            setStartMenuOpen((open) => !open)
          }}
        >
          <span className="start-logo">RB</span>
        </button>

        <label className="search-bar">
          <span role="img" aria-label="Search">
            🔍
          </span>
          <input type="text" placeholder="Search apps, files, settings..." />
        </label>

        <div className="taskbar-apps">
          {TASKBAR_APPS.map((app) => {
            const windowForApp = windows.find((window) => window.app === app.app && !window.minimized)
            return (
              <button
                key={app.app}
                type="button"
                className={`taskbar-app${windowForApp ? ' active' : ''}`}
                data-app={app.app}
                title={app.title}
                onClick={() => handleTaskbarClick(app.app)}
              >
                {app.emoji}
              </button>
            )
          })}
        </div>

        <div className="system-tray">
          <button type="button" className="tray-icon" title="Network">
            📡
          </button>
          <button type="button" className="tray-icon" title="Volume">
            🔊
          </button>
          <button type="button" className="tray-icon" title="Battery">
            🔋
          </button>
          <button type="button" className="clock" title="Open clock">
            <div className="clock-time">{clock.time}</div>
            <div className="clock-date">{clock.date}</div>
          </button>
        </div>
      </div>

      <div
        className={`start-menu${startMenuOpen ? ' show' : ''}`}
        ref={startMenuRef}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="start-menu-header">
          <div className="start-menu-user">
            <div className="user-avatar">C</div>
            <div className="user-info">
              <h3>Cecilia</h3>
              <p>cecilia@blackroad.os</p>
            </div>
          </div>
        </div>

        <div className="start-menu-content">
          <div className="start-menu-section">
            <h4>📌 Pinned Apps</h4>
            <div className="app-grid-start">
              {PINNED_APPS.map((appName) => (
                <button
                  key={appName}
                  type="button"
                  className="app-tile"
                  onClick={() => openWindow(appName)}
                >
                  <div className="app-tile-icon" aria-hidden="true">
                    {APP_CONTENT[appName]?.title?.split(' ')[0] || '📁'}
                  </div>
                  <div className="app-tile-name">{APP_LABELS[appName] || appName}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="start-menu-section">
            <h4>🕐 Recent</h4>
            <div className="recent-list">
              {RECENT_ITEMS.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  className="recent-item"
                  onClick={() => window.alert(`Opening: ${item.name}`)}
                >
                  <div className="recent-icon" aria-hidden="true">
                    {item.icon}
                  </div>
                  <div className="recent-info">
                    <div className="recent-name">{item.name}</div>
                    <div className="recent-time">{item.time}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="start-menu-footer">
          <button type="button" className="footer-button">
            <span role="img" aria-label="Profile">
              👤
            </span>
            <span>Profile</span>
          </button>
          <button type="button" className="footer-button" onClick={() => openWindow('settings')}>
            <span role="img" aria-label="Settings">
              ⚙️
            </span>
            <span>Settings</span>
          </button>
          <button
            type="button"
            className="footer-button"
            onClick={() => window.alert('💤 Sleep Mode\n\nSystem will enter sleep mode.')}
          >
            <span role="img" aria-label="Power">
              ⏻
            </span>
            <span>Power</span>
          </button>
        </div>
      </div>

      <div className="windows-container">
        {windows.map((window) => {
          const data = APP_CONTENT[window.app]
          const style = window.maximized
            ? {
                width: '100vw',
                height: 'calc(100vh - 48px)',
                top: 0,
                left: 0,
                borderRadius: '0',
              }
            : {
                width: '700px',
                height: '500px',
                top: `${window.top}px`,
                left: `${window.left}px`,
                borderRadius: '12px',
              }

          return (
            <div
              key={window.id}
              className="window show"
              style={{
                ...style,
                zIndex: window.zIndex,
                display: window.minimized ? 'none' : 'flex',
              }}
              onMouseDown={() => makeWindowActive(window.id)}
            >
              <div className="window-titlebar">
                <div className="window-title">
                  <span>{data?.title}</span>
                </div>
                <div className="window-controls">
                  <button
                    type="button"
                    className="window-control-btn minimize"
                    onClick={() => minimizeWindow(window.id)}
                  >
                    ─
                  </button>
                  <button
                    type="button"
                    className="window-control-btn maximize"
                    onClick={() => toggleMaximizeWindow(window.id)}
                  >
                    □
                  </button>
                  <button
                    type="button"
                    className="window-control-btn close"
                    onClick={() => closeWindow(window.id)}
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="window-content">{data?.body}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

