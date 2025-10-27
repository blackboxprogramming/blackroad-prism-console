import React, { useEffect, useMemo, useRef, useState } from 'react';
import { connect } from '@blackroad/chat-sdk';
import Message from './Message.jsx';
import EventRow from './EventRow.jsx';

const DEFAULT_MESSAGES = [];

export default function ChatPanel({ jobId, protocol = 'graphql', baseUrl = '', permissions, initialMessages }) {
  const [messages, setMessages] = useState(initialMessages ?? DEFAULT_MESSAGES);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const clientRef = useRef(null);
  const listRef = useRef(null);

  const canPost = permissions?.canPost ?? true;

  useEffect(() => {
    if (!jobId) {
      setMessages(initialMessages ?? DEFAULT_MESSAGES);
      return () => {};
    }

    const client = connect({ jobId, protocol, baseUrl });
    clientRef.current = client;
    let mounted = true;
    setStatus('connecting');

    client
      .fetchThread()
      .then((thread) => {
        if (mounted) {
          setMessages(thread);
          setStatus('ready');
        }
      })
      .catch((err) => {
        if (mounted) {
          setStatus('error');
          setError(err);
        }
      });

    const unsubscribe = client.subscribe((message) => {
      setMessages((prev) => {
        const seen = new Map(prev.map((item) => [item.id, item]));
        seen.set(message.id, message);
        return Array.from(seen.values()).sort((a, b) => a.ts.localeCompare(b.ts));
      });
    });

    return () => {
      mounted = false;
      unsubscribe();
      client.close();
      if (clientRef.current === client) {
        clientRef.current = null;
      }
    };
  }, [jobId, protocol, baseUrl, initialMessages]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!input.trim() || !clientRef.current) return;
    try {
      setStatus('posting');
      await clientRef.current.post(input.trim());
      setInput('');
      setStatus('ready');
    } catch (err) {
      setStatus('error');
      setError(err);
    }
  };

  const ordered = useMemo(() => [...messages].sort((a, b) => a.ts.localeCompare(b.ts)), [messages]);

  return (
    <div className="flex h-full flex-col rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Chat</h2>
          {jobId ? <p className="text-xs text-slate-500">Live events for job {jobId}</p> : <p className="text-xs text-slate-500">Select a job</p>}
        </div>
        <span className="text-xs uppercase text-slate-500">{status}</span>
      </div>

      {error ? <div className="px-4 py-2 text-sm text-red-600">{error.message}</div> : null}

      <div ref={listRef} className="flex-1 overflow-auto px-4 py-3">
        {!ordered.length ? <p className="text-sm text-slate-500">No events yet.</p> : null}
        <ol className="space-y-3">
          {ordered.map((message) => (
            <li key={message.id}>
              {message.role === 'system' ? <EventRow event={message} /> : <Message message={message} />}
            </li>
          ))}
        </ol>
      </div>

      <form onSubmit={handleSubmit} className="border-t border-slate-200 p-3">
        <label className="mb-2 block text-xs font-semibold text-slate-600" htmlFor="chat-input">
          Reply
        </label>
        <textarea
          id="chat-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={!canPost || !jobId}
          placeholder={canPost ? 'Send a note, /command, or link an artifact…' : 'Read-only access'}
          className="h-24 w-full resize-none rounded border border-slate-300 bg-white p-2 text-sm text-slate-800 focus:border-slate-500 focus:outline-none"
        />
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          <span>{input.startsWith('/') ? 'Commands: /rerun, /cancel, /pin, /link <artifactId>' : 'Supports markdown + /commands'}</span>
          <button
            type="submit"
            disabled={!canPost || !input.trim()}
            className="rounded bg-slate-900 px-3 py-1 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
