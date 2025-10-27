const React = require('react');
const ReactDOM = require('react-dom/client');
const { ipcRenderer } = require('electron');

const apps = [
  { id: 'raptor', name: 'Raptor', icon: '🦅', pinned: true },
  { id: 'connections', name: 'Connections', icon: '🔗', pinned: true },
  { id: 'diaries', name: 'Diaries', icon: '📔', pinned: true },
  { id: 'flights', name: 'Flights', icon: '✈️', pinned: true },
  { id: 'cascading', name: 'Cascading', icon: '💧', pinned: false },
  { id: 'debugging', name: 'Debugging', icon: '🐛', pinned: false },
  { id: 'meditation', name: 'Meditation', icon: '🧘', pinned: false },
  { id: 'health', name: 'Health', icon: '💪', pinned: false },
  { id: 'calendar', name: 'Calendar', icon: '📅', pinned: false },
  { id: 'history', name: 'History', icon: '⏳', pinned: false },
  { id: 'notes', name: 'Notes', icon: '📝', pinned: false },
  { id: 'explorer', name: 'Data Explorer', icon: '📊', pinned: false }
];

const desktopIcons = [
  { id: 'raptor', name: 'Raptor', icon: '🦅' },
  { id: 'connections', name: 'Connections', icon: '🔗' },
  { id: 'files', name: 'My Files', icon: '📁' },
  { id: 'recycle', name: 'Recycle Bin', icon: '🗑️' }
];

function useClock() {
  const [now, setNow] = React.useState(() => new Date());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const time = React.useMemo(
    () =>
      now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
    [now]
  );

  const date = React.useMemo(
    () =>
      now.toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric'
      }),
    [now]
  );

  return { time, date };
}

function DesktopIcon({ app, onOpen }) {
  return (
    React.createElement(
      'div',
      {
        className: 'desktop-icon',
        'data-app': app.id,
        onDoubleClick: () => onOpen(app.id)
      },
      React.createElement('div', { className: 'desktop-icon-image' }, app.icon),
      React.createElement('div', { className: 'desktop-icon-label' }, app.name)
    )
  );
}

function TaskbarApp({ app, active, onOpen }) {
  const className = active ? 'taskbar-app active' : 'taskbar-app';
  return React.createElement(
    'div',
    {
      className,
      'data-app': app.id,
      title: app.name,
      onClick: () => onOpen(app.id)
    },
    app.icon
  );
}

function AppTile({ app, onOpen }) {
  return React.createElement(
    'div',
    {
      className: 'app-tile',
      'data-app': app.id,
      onClick: () => onOpen(app.id)
    },
    React.createElement('div', { className: 'app-tile-icon' }, app.icon),
    React.createElement('div', { className: 'app-tile-name' }, app.name)
  );
}

function StartMenu({ open, searchQuery, onOpenApp, menuRef }) {
  const title = searchQuery ? '🔍 Search Results' : '📌 Pinned Apps';
  const menuApps = React.useMemo(() => {
    if (!searchQuery) {
      return apps;
    }
    const lowered = searchQuery.toLowerCase();
    return apps.filter((app) => app.name.toLowerCase().includes(lowered));
  }, [searchQuery]);

  return React.createElement(
    'div',
    {
      className: open ? 'start-menu show' : 'start-menu',
      id: 'startMenu',
      ref: menuRef
    },
    React.createElement(
      'div',
      { className: 'start-menu-header' },
      React.createElement('div', { className: 'user-avatar' }, 'C'),
      React.createElement(
        'div',
        { className: 'user-info' },
        React.createElement('h3', null, 'Cecilia'),
        React.createElement('p', null, 'cecilia@blackroad.os')
      )
    ),
    React.createElement(
      'div',
      { className: 'start-menu-content' },
      React.createElement('h4', {
        style: {
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.5)',
          marginBottom: '16px'
        }
      }, title),
      React.createElement('div', { className: 'app-grid' },
        menuApps.length > 0
          ? menuApps.map((app) => React.createElement(AppTile, { key: app.id, app, onOpen: onOpenApp }))
          : React.createElement('div', {
              style: {
                gridColumn: '1 / -1',
                padding: '48px 0',
                textAlign: 'center',
                color: 'var(--text-secondary)'
              }
            }, 'No apps found')
      )
    ),
    React.createElement(
      'div',
      { className: 'start-menu-footer' },
      React.createElement('button', { className: 'footer-button', type: 'button' }, '⚙️ Settings'),
      React.createElement(
        'button',
        {
          className: 'footer-button',
          type: 'button',
          onClick: () => {
            const shouldShutdown = window.confirm('Shut down Black Road OS?');
            if (shouldShutdown) {
              ipcRenderer.send('system-shutdown');
            }
          }
        },
        '⏻ Power'
      )
    )
  );
}

function Desktop() {
  const [startOpen, setStartOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeApps, setActiveApps] = React.useState([]);
  const startMenuRef = React.useRef(null);
  const startButtonRef = React.useRef(null);
  const { time, date } = useClock();

  const pinnedApps = React.useMemo(() => apps.filter((app) => app.pinned), []);

  const handleOpenApp = React.useCallback(
    (appId) => {
      ipcRenderer.send('open-app', appId);
      setActiveApps((current) => (current.includes(appId) ? current : [...current, appId]));
      setStartOpen(false);
      setSearchQuery('');
    },
    []
  );

  React.useEffect(() => {
    const handleDocumentClick = (event) => {
      if (!startOpen) {
        return;
      }
      const menuNode = startMenuRef.current;
      const buttonNode = startButtonRef.current;
      if (
        menuNode &&
        buttonNode &&
        !menuNode.contains(event.target) &&
        !buttonNode.contains(event.target)
      ) {
        setStartOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, [startOpen]);

  React.useEffect(() => {
    if (searchQuery) {
      setStartOpen(true);
    }
  }, [searchQuery]);

  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setStartOpen(false);
        setSearchQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return React.createElement(
    'div',
    { className: 'desktop' },
    React.createElement('div', { className: 'desktop-background' }),
    React.createElement(
      'div',
      { className: 'desktop-icons', id: 'desktopIcons' },
      desktopIcons.map((icon) =>
        React.createElement(DesktopIcon, { key: icon.id, app: icon, onOpen: handleOpenApp })
      )
    ),
    React.createElement(
      'div',
      { className: 'taskbar' },
      React.createElement(
        'div',
        {
          className: 'start-button',
          id: 'startButton',
          ref: startButtonRef,
          onClick: (event) => {
            event.stopPropagation();
            setStartOpen((open) => {
              const next = !open;
              if (!next) {
                setSearchQuery('');
              }
              return next;
            });
          }
        },
        React.createElement('div', { className: 'start-logo' }, 'RB')
      ),
      React.createElement(
        'div',
        { className: 'search-bar' },
        React.createElement('span', null, '🔍'),
        React.createElement('input', {
          type: 'text',
          placeholder: 'Search...',
          value: searchQuery,
          onChange: (event) => setSearchQuery(event.target.value)
        })
      ),
      React.createElement(
        'div',
        { className: 'taskbar-apps', id: 'taskbarApps' },
        pinnedApps.map((app) =>
          React.createElement(TaskbarApp, {
            key: app.id,
            app,
            active: activeApps.includes(app.id),
            onOpen: handleOpenApp
          })
        )
      ),
      React.createElement(
        'div',
        { className: 'system-tray' },
        React.createElement('div', { className: 'tray-icon' }, '📡'),
        React.createElement('div', { className: 'tray-icon' }, '🔊'),
        React.createElement('div', { className: 'tray-icon' }, '🔋'),
        React.createElement(
          'div',
          { className: 'clock', id: 'clock' },
          React.createElement('div', { className: 'clock-time' }, time),
          React.createElement('div', { className: 'clock-date' }, date)
        )
      )
    ),
    React.createElement(StartMenu, {
      open: startOpen,
      searchQuery,
      onOpenApp: handleOpenApp,
      menuRef: startMenuRef
    })
  );
}

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);
root.render(React.createElement(Desktop));

console.log('Black Road Desktop loaded! 🚀');
