import TilesDashboard from './prism/TilesDashboard';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">PRISM Console</h1>
          <p className="text-sm text-gray-600">
            Roll out GitHub, Linear, and Stripe tiles gradually with feature
            flags.
          </p>
        </header>
        <TilesDashboard />
      </div>
    </main>
  );
}
