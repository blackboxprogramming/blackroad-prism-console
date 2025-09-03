'use client';

import { useEffect, useRef, useState } from 'react';

interface Message {
  author: string;
  content: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem('chat');
    if (stored) {
      setMessages(JSON.parse(stored));
    } else {
      fetch('/api/chat')
        .then(res => res.json())
        .then(data => setMessages(data.messages));
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem('chat', JSON.stringify(messages));
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input }),
    });
    const data = await res.json();
    setMessages(data.messages);
    setInput('');
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <main>
      <div className="chat-history">
        {messages.map((msg, idx) => (
          <div key={idx} className="message">
            <strong>{msg.author}:</strong> {msg.content}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="input-area">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </main>
  );
}
