import { useState, useEffect } from "react";

const TABS = ["Logic", "Primes", "Proofs", "Waves", "Finance", "Numbers", "Fractals"];

export default function InfinityMath() {
  const [tab, setTab] = useState("Logic");
  const [data, setData] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const r = await fetch(`/api/math/${tab.toLowerCase()}`);
        setData(await r.text());
      } catch (err) {
        setData("error");
      }
    }
    fetchData();
  }, [tab]);

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">Infinity Math</h2>
      <nav className="flex gap-2 mb-4 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t}
            className={`btn ${t === tab ? "btn-primary" : ""}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </nav>
      <pre className="text-sm whitespace-pre-wrap">{data || "Loading..."}</pre>
    </div>
  );
}
