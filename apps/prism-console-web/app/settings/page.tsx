import { SettingsPanel } from '@/components/SettingsPanel';
import { fetchDashboard } from '@/features/dashboard-api';

export const revalidate = 0;

export default async function SettingsPage() {
  await fetchDashboard();
  return <SettingsPanel />;
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings | Prism Console",
  description: "Configure Prism Console environment and branding"
};

const envVars = [
  { key: "BLACKROAD_API_URL", description: "Base URL for the BlackRoad API" },
  { key: "BLACKROAD_API_TOKEN", description: "Token used for authenticated requests" }
];

const themes = ["Aurora", "Midnight", "Solar", "Stealth"];

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold text-white">Environment</h2>
        <p className="text-sm text-slate-400">Point Prism Console at a staging or production control plane.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {envVars.map((env) => (
            <div key={env.key} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
              <h3 className="text-sm font-semibold text-white">{env.key}</h3>
              <p className="mt-2 text-sm text-slate-400">{env.description}</p>
              <div className="mt-3">
                <input
                  type="text"
                  placeholder={`Configured via .env.local -> ${env.key}`}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-brand-500 focus:outline-none"
                  readOnly
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Branding</h2>
        <p className="text-sm text-slate-400">Align the console with your organization’s look and feel.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {themes.map((theme) => (
            <button
              key={theme}
              type="button"
              className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-6 text-sm font-semibold text-slate-200 transition hover:border-brand-400 hover:text-white"
            >
              {theme}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-white">Access Tokens</h2>
        <p className="text-sm text-slate-400">Rotate console authentication tokens and manage sessions.</p>
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-300">
          <p>
            Token management is federated with the Prism CLI. Visit the identity service or run <code>brc auth:token:rotate</code>
            to mint a fresh token.
          </p>
        </div>
      </section>
    </div>
  );
}
