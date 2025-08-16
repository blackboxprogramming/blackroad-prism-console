export default function Home() {
  return (
    <section className="grid md:grid-cols-2 gap-6">
      <Card title="Docs">
        <ul className="list-disc ml-5">
          <li>Use <code>/toggle ai off</code> to disable AI helpers</li>
          <li>Use <code>/toggle security off</code> to skip security scans</li>
          <li>Run <code>/deploy blackroad</code> to publish</li>
        </ul>
      </Card>
      <Card title="Status">
        <p>Everything is skip-safe. If a tool is missing, the workflow skips instead of failing.</p>
      </Card>
    </section>
  )
}

function Card({ title, children }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      {children}
    </div>
  )
}
