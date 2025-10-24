import { useState } from 'react';
import ArtifactViewer from '@/components/ArtifactViewer';
import ChatPanel from '@/components/ChatPanel';
import GraphControls from '@/components/Graph/Controls';
import GraphCanvas from '@/components/Graph/GraphCanvas';

export default function GraphLabPage() {
  const [job, setJob] = useState(null);
  const [selection, setSelection] = useState(null);

  return (
    <div className="grid grid-cols-[360px_1fr_360px] gap-8 p-8 min-h-screen bg-slate-950 text-white">
      <GraphControls onRun={setJob} onSelect={setSelection} />
      <div className="space-y-6 overflow-y-auto">
        <GraphCanvas job={job} selection={selection} />
        <ArtifactViewer jobId={job?.id} />
      </div>
      <ChatPanel jobId={job?.id} />
import { useState, useCallback } from "react";
import ArtifactViewer from "../../components/ArtifactViewer";
import ChatPanel from "../../components/ChatPanel";
import GraphCanvas from "../../components/Graph/GraphCanvas";
import Controls from "../../components/Graph/Controls";

export default function GraphLab() {
  const [job, setJob] = useState(null);
  const [events, setEvents] = useState([]);

  const handleEvent = useCallback((event) => {
    setEvents((prev) => [...prev, { ...event, id: `${Date.now()}-${prev.length}` }]);
  }, []);

  const handleRun = useCallback((payload) => {
    setJob(payload);
    handleEvent({
      emoji: "🎯",
      text: `Job ${payload?.id ?? "local"} loaded`,
      ts: new Date().toISOString()
    });
  }, [handleEvent]);

  return (
    <div className="grid grid-cols-[360px_1fr_320px] gap-6 h-[calc(100vh-80px)] p-8 bg-slate-950 text-slate-100">
      <Controls onRun={handleRun} onEvent={handleEvent} />
      <div className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <header className="px-6 py-4 border-b border-white/10">
          <h1 className="text-2xl font-semibold">Graph Lab — Spectral · Power-Lloyd · Cahn–Hilliard</h1>
          <p className="text-sm opacity-70">Wire spectral embeddings to layouts and phase-fields with live artifacts.</p>
        </header>
        <GraphCanvas job={job} />
      </div>
      <div className="flex flex-col space-y-4">
        <ArtifactViewer job={job} />
        <ChatPanel jobId={job?.id} events={events} />
      </div>
    </div>
  );
}
