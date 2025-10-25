import React from 'react';
import { Github, Slack, Sparkles, BookOpen, KanbanSquare, Archive } from 'lucide-react';

export type Platform = 'github' | 'huggingface' | 'slack' | 'notion' | 'linear' | 'dropbox';

type Props = {
  platform: Platform;
  label?: string;
  active?: boolean;
};

const iconMap: Record<Platform, React.ComponentType<{ className?: string }>> = {
  github: Github,
  huggingface: Sparkles,
  slack: Slack,
  notion: BookOpen,
  linear: KanbanSquare,
  dropbox: Archive,
};

export const HomeBadge: React.FC<Props> = ({ platform, label, active = true }) => {
  const Icon = iconMap[platform];
  return (
    <div
      className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs uppercase tracking-wide transition-colors ${
        active ? 'bg-emerald-500/10 text-emerald-600 border-emerald-400/40' : 'bg-gray-800/20 text-gray-400 border-gray-500/30'
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label ?? platform}</span>
    </div>
  );
};

export default HomeBadge;
