import { render } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it, vi } from 'vitest';

import { ChatPane } from '@/ui/components/Chat/ChatPane';
import { MemoryEditor } from '@/ui/components/Codex/MemoryEditor';
import { TaskPane } from '@/ui/components/Tasks/TaskPane';
import { SettingsPane } from '@/ui/components/Settings/SettingsPane';

vi.mock('@/ui/hooks/useTasks', () => ({
  useTasks: () => ({
    tasksQuery: { isLoading: false, data: [] },
    runMutation: { mutate: vi.fn(), isPending: false },
    useTask: () => ({ data: null })
  })
}));

vi.mock('@/ui/hooks/useSettings', () => ({
  useSettings: () => ({
    settings: {
      theme: 'system',
      keybindings: { 'command.palette': 'mod+k' },
      modelRouting: 'local',
      dataDirectory: '',
      network: { allowGateway: false, allowTelemetry: false },
      hydrate: vi.fn(),
      update: vi.fn()
    },
    update: vi.fn()
  })
}));

describe('accessibility checks', () => {
  it('ChatPane is accessible', async () => {
    const { container } = render(<ChatPane />);
    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });

  it('MemoryEditor is accessible', async () => {
    const { container } = render(<MemoryEditor onSave={vi.fn()} />);
    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });

  it('TaskPane is accessible', async () => {
    const { container } = render(<TaskPane />);
    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });

  it('SettingsPane is accessible', async () => {
    const { container } = render(<SettingsPane />);
    const results = await axe.run(container);
    expect(results.violations).toHaveLength(0);
  });
});
