export default function SettingsPage() {
  return (
    <section className="space-y-6" aria-labelledby="settings-heading">
      <header>
        <h1 id="settings-heading" className="text-3xl font-semibold text-slate-50">
          Settings
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Mock preferences for BackRoad Web. Real authentication and notification controls will
          arrive in a future release.
        </p>
      </header>
      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-slate-300">Mock mode</dt>
            <dd className="text-base text-slate-100">Enabled (local fixtures)</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-300">Posting delay</dt>
            <dd className="text-base text-slate-100">Default 3 hours (adjust per post)</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
