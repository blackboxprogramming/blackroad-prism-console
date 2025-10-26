import { useState } from 'react';
import { ChatPane } from '../components/Chat/ChatPane';
import { CodexPane } from '../components/Codex/CodexPane';
import { TaskPane } from '../components/Tasks/TaskPane';
import { SettingsPane } from '../components/Settings/SettingsPane';
import { Tabs, TabList, TabTrigger, TabContent } from '../components/Primitives/Tabs';

const tabs = [
  { id: 'chat', label: 'Chat', component: ChatPane },
  { id: 'codex', label: 'Codex', component: CodexPane },
  { id: 'tasks', label: 'Tasks', component: TaskPane },
  { id: 'settings', label: 'Settings', component: SettingsPane }
];

function App() {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className="app-root">
      <header className="app-header">
        <h1>Lucidia Desktop</h1>
        <p className="app-tagline">Local-first AI workspace</p>
      </header>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabList>
          {tabs.map((tab) => (
            <TabTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabTrigger>
          ))}
        </TabList>
        {tabs.map((tab) => (
          <TabContent key={tab.id} value={tab.id}>
            <tab.component />
          </TabContent>
        ))}
      </Tabs>
    </div>
  );
}

export default App;
