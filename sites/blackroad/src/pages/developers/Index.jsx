import React from 'react';
import KeysPanel from './KeysPanel.jsx';
import WebhookPlayground from './WebhookPlayground.jsx';
import ExampleRunner from './ExampleRunner.jsx';

const DevelopersPage = () => {
  return (
    <main className="max-w-5xl mx-auto px-6 py-16 space-y-12">
      <header className="space-y-4 text-center">
        <h1 className="text-4xl font-bold">Build with BlackRoad</h1>
        <p className="text-lg text-gray-600">
          Access sandbox credentials, generate API keys, and explore the public API and SDKs without leaving this page.
        </p>
      </header>
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <KeysPanel />
        <WebhookPlayground />
      </section>
      <ExampleRunner />
      <section className="bg-slate-900 text-white rounded-lg p-8 shadow-lg">
        <h2 className="text-2xl font-semibold mb-3">Active Reflection</h2>
        <p className="text-sm text-slate-200">
          Which surface caused friction? What was confusing in error messages? Share feedback and we&apos;ll reach out within 24 hours.
        </p>
        <form className="mt-4 space-y-3">
          <textarea
            className="w-full rounded border border-slate-700 bg-slate-800 p-3 focus:outline-none focus:ring"
            rows={4}
            placeholder="Tell us how we can improve the sandbox experience..."
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded bg-white px-4 py-2 font-medium text-slate-900 shadow"
          >
            Submit Reflection
          </button>
        </form>
      </section>
    </main>
  );
};

export default DevelopersPage;
