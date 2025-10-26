import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { queryClient } from '../lib/queryClient';
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
