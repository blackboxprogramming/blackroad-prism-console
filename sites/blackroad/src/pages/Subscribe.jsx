import { useEffect, useState } from "react";

export default function Subscribe() {
  const [plans, setPlans] = useState([]);
  const [interval, setInterval] = useState("month");

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const res = await fetch("/api/billing/plans", { cache: "no-store" });
        const data = await res.json();
        if (!dead) setPlans(Array.isArray(data) ? data : []);
      } catch {
        if (!dead) setPlans([]);
      }
    })();
    return () => {
      dead = true;
    };
  }, []);

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Subscribe</h2>
        <button
          className="btn-secondary"
          onClick={() =>
            setInterval(interval === "month" ? "year" : "month")
          }
        >
          {interval === "month" ? "Annual" : "Monthly"}
        </button>
      </header>
      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((p) => (
          <div key={p.id} className="panel p-4 flex flex-col">
            <h3 className="text-xl mb-2">{p.name}</h3>
            <div className="text-3xl mb-2">
              {interval === "month"
                ? `$${(p.monthly / 100).toFixed(0)}`
                : `$${(p.annual / 100).toFixed(0)}`}
            </div>
            <ul className="text-sm flex-1 list-disc list-inside mb-4">
              {p.features?.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <button className="btn-primary" disabled>
              Coming Soon
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
