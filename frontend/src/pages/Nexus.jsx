import React, { useMemo, useState } from 'react'
import './Nexus.css'

const sidebarTabs = ['Integrations', 'Models', 'Projects']
const panelTabs = ['Activity', 'Context', 'Stats']
const toolButtons = [
  { label: 'Python', icon: '🐍' },
  { label: 'JavaScript', icon: '📜' },
  { label: 'Shell', icon: '🔧' },
  { label: 'Attach Files', icon: '📁' },
  { label: 'Web Scrape', icon: '🌐' },
  { label: 'Visualize', icon: '📊' },
  { label: 'Deploy', icon: '🚀' },
]

const integrationSections = [
  {
    title: 'Cloud & Infrastructure',
    items: [
      {
        icon: '🌊',
        name: 'DigitalOcean',
        status: 'Connected • 3 droplets',
        connected: true,
      },
      {
        icon: '🐳',
        name: 'Docker',
        status: 'Connected • 7 containers',
        connected: true,
      },
      {
        icon: '🥧',
        name: 'Raspberry Pi',
        status: '3 devices online',
        connected: true,
      },
      {
        icon: '⚡',
        name: 'Termius',
        status: 'Click to connect',
        connected: false,
      },
    ],
  },
  {
    title: 'AI & ML Models',
    items: [
      {
        icon: '🤗',
        name: 'HuggingFace',
        status: '12 models loaded',
        connected: true,
      },
      {
        icon: '🟢',
        name: 'OpenAI',
        status: 'GPT-4 ready',
        connected: true,
      },
      {
        icon: '🎭',
        name: 'Claude API',
        status: 'Sonnet 4.5 active',
        connected: true,
      },
    ],
  },
  {
    title: 'Development Tools',
    items: [
      {
        icon: '📁',
        name: 'GitHub',
        status: '42 repositories',
        connected: true,
      },
      {
        icon: '💻',
        name: 'VS Code',
        status: 'Remote enabled',
        connected: true,
      },
      {
        icon: '✅',
        name: 'Asana',
        status: '8 active tasks',
        connected: true,
      },
    ],
  },
  {
    title: 'Engines & Tools',
    items: [
      {
        icon: '🎮',
        name: 'Unity',
        status: 'Click to connect',
        connected: false,
      },
      {
        icon: '🎯',
        name: 'Unreal Engine',
        status: 'Click to connect',
        connected: false,
      },
      {
        icon: '📊',
        name: 'Desmos',
        status: 'Math engine ready',
        connected: true,
      },
    ],
  },
]

const activityFeed = [
  {
    icon: '✅',
    title: 'Task Created',
    time: '1m ago',
    description: 'Created 3 Asana tasks for stale repositories',
  },
  {
    icon: '▶️',
    title: 'Code Executed',
    time: '1m ago',
    description: 'Ran stale_repos_tracker.py successfully',
  },
  {
    icon: '📁',
    title: 'Saved to GitHub',
    time: '2m ago',
    description: 'Committed scripts/stale-repos-tracker.py',
  },
  {
    icon: '🔗',
    title: 'API Connected',
    time: '5m ago',
    description: 'Connected to GitHub & Asana APIs',
  },
  {
    icon: '🐳',
    title: 'Container Started',
    time: '15m ago',
    description: 'Started postgres:14 on droplet-prod-01',
  },
  {
    icon: '🥧',
    title: 'Pi Status Check',
    time: '30m ago',
    description: 'All 3 Raspberry Pi devices online and healthy',
  },
]

const contextItems = [
  { label: 'Active Model', value: 'Llama 3.2 90B Instruct (HuggingFace)' },
  { label: 'Working Directory', value: '/home/user/blackroad-projects' },
  { label: 'Current Branch', value: 'main • blackroad/nexus-core' },
  { label: 'Connected Services', value: '12 integrations active' },
]

const statCards = [
  { label: 'Code Executions Today', value: '47', progress: 75 },
  { label: 'API Calls', value: '1,284', progress: 45 },
  { label: 'Tokens Used', value: '89K', progress: 30 },
]

const pythonCode = `import requests
from datetime import datetime, timedelta
import os

# Configuration
GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN')
ASANA_TOKEN = os.environ.get('ASANA_TOKEN')
ASANA_WORKSPACE = 'your_workspace_id'

def get_stale_repos():
    """Fetch GitHub repos not updated in 30+ days"""
    headers = {'Authorization': f'token {GITHUB_TOKEN}'}
    response = requests.get(
        'https://api.github.com/user/repos',
        headers=headers
    )
    repos = response.json()

    stale_repos = []
    cutoff_date = datetime.now() - timedelta(days=30)

    for repo in repos:
        updated = datetime.strptime(
            repo['updated_at'],
            '%Y-%m-%dT%H:%M:%SZ'
        )
        if updated < cutoff_date:
            stale_repos.append(repo)

    return stale_repos

def create_asana_task(repo):
    """Create Asana task for stale repo"""
    headers = {
        'Authorization': f'Bearer {ASANA_TOKEN}',
        'Content-Type': 'application/json'
    }

    task_data = {
        'data': {
            'name': f'Update stale repo: {repo["name"]}',
            'notes': f'Repo URL: {repo["html_url"]}\\n'
                     f'Last updated: {repo["updated_at"]}\\n'
                     f'Description: {repo["description"]}',
            'workspace': ASANA_WORKSPACE
        }
    }

    response = requests.post(
        'https://app.asana.com/api/1.0/tasks',
        headers=headers,
        json=task_data
    )
    return response.json()

# Main execution
if __name__ == '__main__':
    stale_repos = get_stale_repos()
    print(f'Found {len(stale_repos)} stale repositories')

    for repo in stale_repos:
        result = create_asana_task(repo)
        print(f'Created task for: {repo["name"]}')
`

const executionResult = `$ python stale_repos_tracker.py
Found 3 stale repositories
Created task for: old-project-2023
Created task for: archived-experiments
Created task for: legacy-dashboard

✓ Successfully created 3 Asana tasks
⏱ Execution time: 1.2s`

export default function Nexus(){
  const [activeSidebarTab, setActiveSidebarTab] = useState(sidebarTabs[0])
  const [activePanelTab, setActivePanelTab] = useState(panelTabs[0])
  const [activeTools, setActiveTools] = useState([toolButtons[0].label])
  const [message, setMessage] = useState('')

  const sidebarContent = useMemo(() => {
    if(activeSidebarTab !== 'Integrations'){
      return (
        <div className="sidebar-placeholder">
          <strong>{activeSidebarTab}</strong> workspace views are coming soon. You’ll be able to curate model catalogs and cross-project resource maps here.
        </div>
      )
    }

    return integrationSections.map(section => (
      <div className="integration-section" key={section.title}>
        <div className="section-title">{section.title}</div>
        {section.items.map(item => (
          <div
            key={item.name}
            className={`integration-card${item.connected ? ' connected' : ''}`}
            role="button"
            tabIndex={0}
          >
            <div className="integration-icon" aria-hidden>{item.icon}</div>
            <div className="integration-info">
              <div className="integration-name">{item.name}</div>
              <div className={`integration-status${item.connected ? ' connected' : ''}`}>
                {item.status}
              </div>
            </div>
            <div className={`connection-indicator${item.connected ? ' connected' : ''}`} aria-hidden />
          </div>
        ))}
      </div>
    ))
  }, [activeSidebarTab])

  const panelContent = useMemo(() => {
    if(activePanelTab === 'Context'){
      return contextItems.map(item => (
        <div className="context-item" key={item.label}>
          <div className="context-label">{item.label}</div>
          <div className="context-value">{item.value}</div>
        </div>
      ))
    }

    if(activePanelTab === 'Stats'){
      return statCards.map(card => (
        <div className="stat-card" key={card.label}>
          <div className="stat-label">{card.label}</div>
          <div className="stat-value">{card.value}</div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${card.progress}%` }} />
          </div>
        </div>
      ))
    }

    return activityFeed.map(item => (
      <div className="activity-item" key={`${item.title}-${item.time}`}>
        <div className="activity-header">
          <div className="activity-icon" aria-hidden>{item.icon}</div>
          <div className="activity-title">{item.title}</div>
          <div className="activity-time">{item.time}</div>
        </div>
        <div className="activity-description">{item.description}</div>
      </div>
    ))
  }, [activePanelTab])

  const toggleTool = (label) => {
    setActiveTools(prev => (
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    ))
  }

  const handleCopy = () => {
    if(typeof navigator !== 'undefined' && navigator.clipboard?.writeText){
      navigator.clipboard.writeText(pythonCode)
    }
  }

  const handleSend = () => {
    const trimmed = message.trim()
    if(!trimmed){
      return
    }
    if(typeof window !== 'undefined'){
      window.alert('In a full implementation this would send your message to the AI backend!')
    }
    setMessage('')
  }

  return (
    <div className="nexus-page">
      <header className="header">
        <div className="logo">
          <div className="logo-icon">K3</div>
          <div className="logo-text">BlackRoad Nexus</div>
        </div>
        <div className="header-center">
          <button className="model-selector" type="button">
            <div className="model-status" />
            <span>Llama 3.2 90B (HuggingFace)</span>
            <span aria-hidden>▼</span>
          </button>
        </div>
        <div className="header-right">
          <button className="header-button" type="button">
            <span aria-hidden>⚡</span>
            <span>Quick Actions</span>
          </button>
          <button className="header-button active" type="button">
            <span aria-hidden>🔗</span>
            <span>Connected: 12</span>
          </button>
        </div>
      </header>

      <div className="main-container">
        <aside className="sidebar">
          <div className="sidebar-tabs">
            {sidebarTabs.map(tab => (
              <button
                key={tab}
                type="button"
                className={`sidebar-tab${activeSidebarTab === tab ? ' active' : ''}`}
                onClick={() => setActiveSidebarTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="sidebar-content">
            {sidebarContent}
          </div>
        </aside>

        <main className="content-area">
          <div className="chat-container">
            <div className="messages-area">
              <div className="message">
                <div className="message-avatar">K3</div>
                <div className="message-content">
                  <div className="message-header">
                    <span className="message-author">BlackRoad Nexus</span>
                    <span className="message-time">Just now</span>
                  </div>
                  <div className="message-text">
                    <p>
                      Welcome to BlackRoad Nexus! I'm your AI development assistant with native code execution and seamless integration across your entire development ecosystem.
                    </p>
                    <p>🚀 <strong>What I can do:</strong></p>
                    <ul className="message-list">
                      <li>Write, run, and debug code in Python, JavaScript, C++, and more</li>
                      <li>Deploy directly to DigitalOcean, manage Docker containers</li>
                      <li>Create and manage GitHub repos, commit changes</li>
                      <li>Control your Raspberry Pi devices remotely</li>
                      <li>Generate math visualizations with Desmos</li>
                      <li>Manage tasks in Asana, open files in VS Code</li>
                      <li>Access multiple AI models (GPT-4, Claude, Llama, etc.)</li>
                    </ul>
                    <p>
                      Try: <em>"Create a Python script that monitors my DigitalOcean droplets"</em> or <em>"Deploy a Docker container to my Raspberry Pi"</em>
                    </p>
                  </div>
                </div>
              </div>

              <div className="message">
                <div className="message-avatar user">U</div>
                <div className="message-content">
                  <div className="message-header">
                    <span className="message-author">You</span>
                    <span className="message-time">2 minutes ago</span>
                  </div>
                  <div className="message-text">
                    Write a Python script that fetches my GitHub repos and creates a new Asana task for each repo that hasn't been updated in 30 days
                  </div>
                </div>
              </div>

              <div className="message">
                <div className="message-avatar">K3</div>
                <div className="message-content">
                  <div className="message-header">
                    <span className="message-author">BlackRoad Nexus</span>
                    <span className="message-time">Just now</span>
                  </div>
                  <div className="message-text">
                    I'll create a Python script that integrates with both GitHub and Asana APIs to accomplish this. Here's the solution:
                  </div>

                  <div className="code-block">
                    <div className="code-header">
                      <span className="code-language">Python</span>
                      <div className="code-actions">
                        <button className="code-action-btn" type="button" onClick={handleCopy}>Copy</button>
                        <button className="code-action-btn" type="button">Run</button>
                        <button className="code-action-btn" type="button">Save to GitHub</button>
                      </div>
                    </div>
                    <pre className="code-content">
                      <code>{pythonCode}</code>
                    </pre>
                  </div>

                  <div className="execution-result">
                    <code>{executionResult}</code>
                  </div>

                  <div className="message-text" style={{ marginTop: 12 }}>
                    ✅ Script executed successfully! I've created 3 Asana tasks for your stale repositories. The script has been saved to your GitHub at <code>scripts/stale-repos-tracker.py</code>.
                    <br />
                    <br />
                    Would you like me to set up a cron job to run this automatically every week?
                  </div>
                </div>
              </div>
            </div>

            <div className="input-area">
              <div className="input-wrapper">
                <div className="input-toolbar">
                  {toolButtons.map(({ label, icon }) => (
                    <button
                      key={label}
                      type="button"
                      className={`tool-button${activeTools.includes(label) ? ' active' : ''}`}
                      onClick={() => toggleTool(label)}
                    >
                      <span aria-hidden>{icon}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>

                <div className="input-box">
                  <textarea
                    className="input-field"
                    placeholder="Ask me to code, deploy, analyze, or integrate anything... I can execute code natively and connect to all your services."
                    value={message}
                    onChange={event => setMessage(event.target.value)}
                  />
                  <button
                    className="send-button"
                    type="button"
                    onClick={handleSend}
                    disabled={!message.trim()}
                  >
                    <span>Send</span>
                    <span aria-hidden>⚡</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>

        <aside className="right-panel">
          <div className="panel-tabs">
            {panelTabs.map(tab => (
              <button
                key={tab}
                type="button"
                className={`panel-tab${activePanelTab === tab ? ' active' : ''}`}
                onClick={() => setActivePanelTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="panel-content">
            {panelContent}
          </div>
        </aside>
      </div>
    </div>
  )
}
