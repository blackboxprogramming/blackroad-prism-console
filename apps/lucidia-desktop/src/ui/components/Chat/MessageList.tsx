import { ChatMessage } from '@/shared/types';
import { ChatMessage } from '../../../shared/types';

interface MessageListProps {
  messages: ChatMessage[];
}

const ROLE_LABELS: Record<ChatMessage['role'], string> = {
  user: 'You',
  assistant: 'Lucidia',
  system: 'System'
};

export const MessageList = ({ messages }: MessageListProps) => (
  <div className="flex flex-col gap-4">
    {messages.map((message) => (
      <article key={message.id} className="rounded-lg border border-slate-700 bg-surface-muted p-4">
        <header className="mb-2 flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
          <span>{ROLE_LABELS[message.role]}</span>
          <time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString()}</time>
        </header>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-100">{message.content}</p>
      </article>
    ))}
  </div>
);
export function MessageList({ messages }: MessageListProps) {
  return (
    <div className="message-list">
      {messages.map((message) => (
        <article key={message.id} className={`message message-${message.role}`}>
          <header>
            <span className="message-role">{message.role}</span>
            <span className="message-time">
              {new Date(message.createdAt).toLocaleTimeString()}
            </span>
          </header>
          <p>{message.content}</p>
        </article>
      ))}
    </div>
  );
}
