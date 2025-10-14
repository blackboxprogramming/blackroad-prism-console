import { useEffect, useMemo, useState } from "react";

const FLOW_STEPS = [
  {
    id: 0,
    label: "Welcome",
    summary: "Frame the promise and set up the fast loop.",
  },
  {
    id: 1,
    label: "Upload",
    summary: "Collect one piece and prime the mock balance.",
  },
  {
    id: 2,
    label: "Live + Reward",
    summary: "Show the loop closing with a payout rehearsal.",
  },
];

const CONFETTI_COLORS = ["#FF8DC7", "#FBBF24", "#6EE7B7", "#93C5FD", "#F472B6"];
const BASE_BALANCE = 128.4;

export default function CreatorLightpath() {
  const [step, setStep] = useState(0);
  const [fileName, setFileName] = useState("");
  const [viewCount, setViewCount] = useState(0);
  const [roadCoinEarned, setRoadCoinEarned] = useState(0);
  const [payoutChecked, setPayoutChecked] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  const confettiPieces = useMemo(
    () =>
      Array.from({ length: 16 }).map((_, index) => ({
        color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
        delay: (index % 6) * 0.18,
      })),
    [],
  );

  useEffect(() => {
    if (step !== 2) {
      setViewCount(0);
      setRoadCoinEarned(0);
      setPayoutChecked(false);
      setRewardClaimed(false);
      return undefined;
    }

    let frame = 0;
    const viewTarget = 142;
    const roadCoinTarget = 12.8;

    const interval = window.setInterval(() => {
      frame += 1;
      setViewCount((prev) => (prev < viewTarget ? Math.min(viewTarget, prev + Math.ceil(Math.random() * 3)) : prev));
      setRoadCoinEarned((prev) => {
        if (prev >= roadCoinTarget) return prev;
        const next = Number((prev + 0.25 + Math.random() * 0.2).toFixed(2));
        return next > roadCoinTarget ? roadCoinTarget : next;
      });

      if (frame > 40) {
        window.clearInterval(interval);
      }
    }, 260);

    return () => window.clearInterval(interval);
  }, [step]);

  const moveNext = () => setStep((prev) => Math.min(prev + 1, FLOW_STEPS.length - 1));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-12">
        <header className="flex flex-col gap-3">
          <span className="text-xs uppercase tracking-[0.4em] text-slate-400">Creator lightpath</span>
          <h1 className="text-3xl font-semibold text-white md:text-4xl">A three-click loop to prove the system is alive.</h1>
          <p className="max-w-2xl text-sm text-slate-300">
            Guide new creators through a single upload, a simulated publish, and a payout confirmation. Keep it concrete,
            keep it under ten minutes, and let them watch their RoadCoin balance jump in real time.
          </p>
        </header>

        <section className="rounded-2xl border border-white/5 bg-white/5 p-6 shadow-xl backdrop-blur">
          <ProgressRail step={step} />

          {step === 0 && <WelcomeScreen onNext={moveNext} />}
          {step === 1 && <UploadScreen fileName={fileName} onFileChange={setFileName} onPublish={moveNext} />}
          {step === 2 && (
            <LiveRewardScreen
              baseBalance={BASE_BALANCE}
              confettiPieces={confettiPieces}
              onClaim={() => setRewardClaimed(true)}
              onPayoutTest={() => setPayoutChecked(true)}
              payoutChecked={payoutChecked}
              rewardClaimed={rewardClaimed}
              roadCoinEarned={roadCoinEarned}
              viewCount={viewCount}
            />
          )}
        </section>

        <footer className="grid gap-4 rounded-2xl border border-white/5 bg-slate-950/60 p-6 text-sm text-slate-300 md:grid-cols-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Loop checkpoints</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {FLOW_STEPS.map((item) => (
                <li key={item.id} className="flex gap-3">
                  <span
                    className={`mt-1 h-2.5 w-2.5 rounded-full ${step >= item.id ? "bg-emerald-400" : "bg-white/20"}`}
                  />
                  <div>
                    <p className="font-medium text-white">{item.label}</p>
                    <p className="text-xs text-slate-400">{item.summary}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-white/5 bg-black/40 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Designer note</p>
            <p className="mt-2 text-sm text-slate-200">
              This screen set is coded inside the BlackRoad Vite + React sandbox. Clone, tweak copy, or restyle fast, then export
              to a Figma or Framer handoff. Perfect for pairing with a live demo or usability test.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

function ProgressRail({ step }) {
  return (
    <div className="mb-6 flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
        <span>Step {step + 1}</span>
        <span>{FLOW_STEPS[step]?.label}</span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-fuchsia-400 via-sky-400 to-amber-300 transition-all duration-500"
          style={{ width: `${((step + 1) / FLOW_STEPS.length) * 100}%` }}
        />
      </div>
    </div>
  );
}

function WelcomeScreen({ onNext }) {
  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-black/30 p-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-emerald-300/80">Screen 1 – Welcome</p>
        <h2 className="text-2xl font-semibold text-white">You create. We handle the rest.</h2>
        <p className="text-sm text-slate-300">
          A short demo run to test upload → publish → payout. Takes under 10 minutes. You’ll see your reward appear live.
        </p>
      </div>
      <button
        className="inline-flex items-center justify-center rounded-lg bg-emerald-400 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300"
        onClick={onNext}
      >
        Let’s Start
      </button>
    </div>
  );
}

function UploadScreen({ fileName, onFileChange, onPublish }) {
  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    onFileChange(file ? file.name : "");
  };

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-emerald-400/20 bg-black/30 p-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-emerald-300/80">Screen 2 – Upload</p>
        <h2 className="text-xl font-semibold text-white">Drop in one piece you’re proud of.</h2>
        <p className="text-sm text-slate-300">Supports video, image, or text.</p>
      </div>

      <label
        className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/20 bg-white/5 p-6 text-center text-sm text-slate-300 transition hover:border-emerald-300/60 hover:bg-white/10"
      >
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-white/80">Upload zone</span>
        <span className="text-base font-medium text-white/90">Drag & drop or browse</span>
        <span className="text-xs text-slate-400">{fileName || "video / image / text"}</span>
        <input className="hidden" type="file" onChange={handleFileChange} />
      </label>

      <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span>Mock RoadCoin balance</span>
          <span>{BASE_BALANCE.toFixed(2)} RC</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/3 bg-gradient-to-r from-emerald-400 via-sky-400 to-amber-300" />
        </div>
        <p className="text-xs text-slate-400">You’ll see this number change when your work goes live.</p>
      </div>

      <button
        className="inline-flex items-center justify-center self-start rounded-lg bg-emerald-400 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-white/30 disabled:text-white/60"
        disabled={!fileName}
        onClick={onPublish}
      >
        Publish
      </button>
    </div>
  );
}

function LiveRewardScreen({
  baseBalance,
  confettiPieces,
  onClaim,
  onPayoutTest,
  payoutChecked,
  rewardClaimed,
  roadCoinEarned,
  viewCount,
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-400/40 bg-black/30 p-6">
      <div aria-hidden className="pointer-events-none absolute inset-x-6 top-0 flex justify-between text-2xl">
        {confettiPieces.map((piece, index) => (
          <span
            key={index}
            className="animate-bounce"
            style={{ color: piece.color, animationDelay: `${piece.delay}s` }}
          >
            •
          </span>
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-emerald-300/80">Screen 3 – Live + Reward</p>
        <h2 className="text-2xl font-semibold text-white">It’s up.</h2>
        <p className="text-sm text-slate-300">Your drop is live. Watch the counters climb, then run the payout rehearsal.</p>
      </div>

      <div className="mt-6 grid gap-4 rounded-xl border border-white/10 bg-white/5 p-5 md:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <div className="rounded-lg border border-white/10 bg-black/40 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Live tile</p>
            <div className="mt-2 flex flex-col gap-3 rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Featured piece</span>
                <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs text-emerald-200">Live</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm text-slate-200">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">View count</p>
                  <p className="text-lg font-semibold text-white">{viewCount}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">RoadCoin earned</p>
                  <p className="text-lg font-semibold text-emerald-300">{roadCoinEarned.toFixed(2)} RC</p>
                </div>
              </div>
            </div>
          </div>

          <button
            className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition ${
              payoutChecked
                ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-200"
                : "border-white/20 bg-white/5 text-white hover:border-emerald-300/60 hover:text-emerald-200"
            }`}
            onClick={onPayoutTest}
            type="button"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-300" />
            Stripe payout test
          </button>

          {payoutChecked ? (
            <p className="text-xs text-emerald-200">Payout confirmed in sandbox. Ready for the real run.</p>
          ) : (
            <p className="text-xs text-slate-400">Trigger the fake payout to complete the loop.</p>
          )}
        </div>

        <aside className="flex flex-col justify-between gap-4 rounded-lg border border-white/10 bg-black/30 p-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Balance update</p>
            <p className="mt-1 text-2xl font-semibold text-white">{(baseBalance + roadCoinEarned).toFixed(2)} RC</p>
            <p className="text-xs text-slate-400">Auto-refreshing demo balance.</p>
          </div>
          <button
            className="inline-flex items-center justify-center rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300"
            onClick={onClaim}
            type="button"
          >
            Claim Reward
          </button>
          {rewardClaimed && (
            <p className="text-sm font-medium text-emerald-200">Welcome to the first five. You just closed the loop.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
