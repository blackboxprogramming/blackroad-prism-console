import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { localeFromPath, withPrefix } from '../lib/i18n.ts'

const defaultStatus = {
  status: 'unknown',
  buildPath: '',
  updated: '',
  message: 'Unity deployment status unavailable.',
  checklist: [],
}

function Section({ title, children, className = '' }) {
  return (
    <section className={`card space-y-3 ${className}`}>
      <h2 className="text-2xl font-semibold">{title}</h2>
      {children}
    </section>
  )
}

export default function UnityHost() {
  const location = useLocation()
  const lang = localeFromPath(location.pathname)
  const [state, setState] = useState({
    loading: true,
    error: '',
    data: defaultStatus,
  })

  useEffect(() => {
    const controller = new AbortController()
    const statusUrl = withPrefix('/api/unity-hosting.json', lang)
    setState((prev) => ({ ...prev, loading: true, error: '' }))
    fetch(statusUrl, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Request failed with status ${res.status}`)
        return res.json()
      })
      .then((data) => {
        setState({ loading: false, error: '', data: { ...defaultStatus, ...data } })
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setState({ loading: false, error: err.message, data: defaultStatus })
      })
    return () => controller.abort()
  }, [lang])

  const buildUrl = useMemo(() => {
    const path = state.data.buildPath
    if (!path) return ''
    if (/^https?:\/\//.test(path)) return path
    return withPrefix(path, lang)
  }, [state.data.buildPath, lang])

  return (
    <div className="space-y-6">
      <Section title="Unity WebGL Host">
        <p className="opacity-90">
          Deploy a Unity WebGL build directly to blackroad.io. Export from Unity, copy the
          generated <code>Build/</code> folder into <code>sites/blackroad/public/unity</code>, and
          update the status file to immediately surface the experience below.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Quick plan</h3>
            <ul className="list-disc ml-5 space-y-1 opacity-90">
              <li>Export a WebGL player from Unity (File → Build Settings → WebGL → Build).</li>
              <li>
                Upload the resulting <code>Build/</code>, <code>TemplateData/</code>, and
                <code>StreamingAssets/</code> (if any) directories under
                <code>public/unity/</code>.
              </li>
              <li>
                Edit <code>public/api/unity-hosting.json</code> with the final path (for example
                <code>"buildPath": "/unity/index.html"</code>).
              </li>
              <li>Refresh this page to validate that the embed loads correctly.</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Helpful commands</h3>
            <pre className="bg-black/40 border border-neutral-800 rounded-xl p-3 text-sm overflow-x-auto">
              <code>{`# Run the Unity exporter stub (generates a template zip)
cd workers/unity
npm install
node server.js`}</code>
            </pre>
            <p className="text-sm opacity-80">
              Replace the stub exporter with your build pipeline or connect it to CI to keep the
              WebGL build fresh.
            </p>
          </div>
        </div>
      </Section>

      <Section title="Deployment status">
        {state.loading && <p>Checking deployment…</p>}
        {!state.loading && state.error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm">
            Unable to load status: {state.error}
          </div>
        )}
        {!state.loading && !state.error && (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm uppercase tracking-wide opacity-60">Status</div>
              <div className="text-xl font-semibold">{state.data.status}</div>
              {state.data.updated && (
                <div className="text-sm opacity-70 mt-1">Last updated {state.data.updated}</div>
              )}
            </div>
            <div>
              <div className="text-sm uppercase tracking-wide opacity-60">Message</div>
              <p className="opacity-90 mt-1">{state.data.message}</p>
            </div>
          </div>
        )}
        {!state.loading && !state.error && state.data.checklist?.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mt-4">Checklist</h3>
            <ul className="list-disc ml-5 space-y-1 opacity-90">
              {state.data.checklist.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      <Section title="WebGL preview">
        {buildUrl ? (
          <div className="rounded-xl border border-neutral-800 overflow-hidden bg-black/60">
            <iframe
              title="Unity WebGL Preview"
              src={buildUrl}
              className="w-full aspect-video"
              allow="fullscreen"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-neutral-700 p-6 text-center opacity-80">
            No build has been published yet. Once <code>buildPath</code> is set the Unity player
            will appear here.
          </div>
        )}
      </Section>

      <Section title="CI integration ideas">
        <ol className="list-decimal ml-5 space-y-2 opacity-90">
          <li>
            Configure a Unity build agent to export WebGL and upload the artifact to
            <code>sites/blackroad/public/unity</code> as part of your deployment pipeline.
          </li>
          <li>
            After upload, patch <code>unity-hosting.json</code> with the new <code>buildPath</code>
            and timestamp using a deploy script or GitHub Action.
          </li>
          <li>
            Run a Lighthouse or Playwright smoke test against the preview URL to confirm the build
            boots without console errors.
          </li>
          <li>
            Optionally extend <code>workers/unity</code> to orchestrate builds on demand and
            trigger status updates for this dashboard.
          </li>
        </ol>
      </Section>
    </div>
  )
}
