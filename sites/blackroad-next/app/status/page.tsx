async function getStatus() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/status.json`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function StatusPage() {
  const doc = await getStatus();
  return (
    <section className="container-x py-12">
      <h2 className="h2 mb-4">Status</h2>
      <pre className="card overflow-x-auto text-sm">
        {doc ? JSON.stringify(doc, null, 2) : "No status.json found"}
      </pre>
    </section>
  );
}
