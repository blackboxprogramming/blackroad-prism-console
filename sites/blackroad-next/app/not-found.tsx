export default function NotFound() {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const tip = base ? `Try ${base}/ instead.` : 'Double-check the link.';
  return (
    <main style={{ padding: 32, fontFamily: 'system-ui, sans-serif' }}>
      <h1>404</h1>
      <p>We couldn’t find that page. {tip}</p>
    </main>
  );
}
