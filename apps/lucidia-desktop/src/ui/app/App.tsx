import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { queryClient } from '../lib/queryClient';
import { useState } from 'react';
import { ChatPane } from '../components/Chat/ChatPane';
import { CodexPane } from '../components/Codex/CodexPane';
import { TaskPane } from '../components/Tasks/TaskPane';
import { SettingsPane } from '../components/Settings/SettingsPane';
import { useSettingsStore } from '../lib/store';
import '../app/main.css';

export const App = (): JSX.Element => {
  const { theme, hydrate } = useSettingsStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="grid h-screen grid-cols-[20rem_1fr_20rem] bg-surface text-slate-100">
        <aside className="border-r border-slate-800 p-4">
          <ChatPane />
        </aside>
        <main className="overflow-y-auto p-4">
          <CodexPane />
        </main>
        <aside className="border-l border-slate-800 p-4 flex flex-col gap-6">
          <TaskPane />
          <SettingsPane />
        </aside>
      </div>
    </QueryClientProvider>
  );
};
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
