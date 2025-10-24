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
    </div>
  );
}
