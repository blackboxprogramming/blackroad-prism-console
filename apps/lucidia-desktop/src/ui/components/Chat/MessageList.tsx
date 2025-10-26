import { ChatMessage } from '../../../shared/types';

interface MessageListProps {
  messages: ChatMessage[];
}

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
