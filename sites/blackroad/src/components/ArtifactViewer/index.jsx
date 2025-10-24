export default function ArtifactViewer({ job }) {
  const artifacts = job?.artifacts ?? [];
  return (
    <section className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-4">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide opacity-70">Artifact Viewer</h2>
        <span className="text-[10px] uppercase opacity-50">{job?.id ?? "idle"}</span>
      </header>
      {artifacts.length === 0 ? (
        <p className="mt-4 text-xs opacity-60">Artifacts will appear once a job completes.</p>
      ) : (
        <ul className="mt-4 space-y-2 text-xs">
          {artifacts.map((artifact) => (
            <li key={artifact.id} className="rounded border border-white/10 bg-black/30 p-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{artifact.description ?? artifact.path}</span>
                <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] uppercase">{artifact.type}</span>
              </div>
              <div className="mt-1 font-mono text-[10px] opacity-60">{artifact.path}</div>
              <div className="font-mono text-[10px] opacity-60">sha256 {artifact.sha256}</div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
