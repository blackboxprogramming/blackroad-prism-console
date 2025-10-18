import { useMemo } from "react";

const NAV_LINKS = ["Home", "Explore", "Library"];

const FILTER_TAGS = ["Recommended", "Motion", "UI", "Animation", "Courses"];

const FEATURED_VIDEO = {
  title: "Designing a Dark Mode UI",
  creator: "waveform",
  views: "129K views",
  published: "3 weeks ago",
  duration: "3:36",
  summary:
    "Build a cinematic dark theme using motion cues, layered lighting, and color grading inspired by the BlackRoad aesthetic.",
  tags: ["UI Animation", "Lucidia", "RoadView"],
};

const PLAYLIST = [
  {
    title: "Modern UI Design Tips!",
    channel: "UI Academy",
    meta: "89K views • today",
    duration: "8:20",
  },
  {
    title: "Learn Programming in 15 Minutes",
    channel: "Simon Codes",
    meta: "58K views • 3 days ago",
    duration: "15:00",
  },
  {
    title: "Gradient Tricks in Figma",
    channel: "figmanub",
    meta: "39K views • 1 week ago",
    duration: "10:12",
  },
  {
    title: "Learn Dark-Mode Redesign",
    channel: "Aesthetic",
    meta: "123K views • 5 days ago",
    duration: "12:45",
  },
];

const RECOMMENDED_VIDEOS = [
  {
    title: "Modern UI Design Tips!",
    creator: "UI Academy",
    views: "89K views",
    published: "today",
    duration: "8:20",
    gradient: "from-[#0D1B3F] via-[#132966] to-[#1B3E7C]",
  },
  {
    title: "Gradient Tricks in Figma",
    creator: "figmanub",
    views: "39K views",
    published: "1 week ago",
    duration: "10:12",
    gradient: "from-[#2A103C] via-[#48195A] to-[#61266F]",
  },
  {
    title: "Learn Dark-Mode Redesign",
    creator: "Aesthetic",
    views: "123K views",
    published: "5 days ago",
    duration: "12:45",
    gradient: "from-[#0F2C37] via-[#1C4B66] to-[#276D8A]",
  },
  {
    title: "HTML & CSS in 15 Minutes",
    creator: "CodeSea",
    views: "78K views",
    published: "2 weeks ago",
    duration: "15:00",
    gradient: "from-[#401023] via-[#671B3A] to-[#8C274F]",
  },
];

const LIBRARY_ROWS = [
  {
    title: "Introduction to Programming",
    creator: "codesacademy",
    views: "875K views",
    published: "4 days ago",
    duration: "12:03",
  },
  {
    title: "The Power of UI Animation",
    creator: "Aesthetic",
    views: "222K views",
    published: "5 days ago",
    duration: "5:56",
  },
  {
    title: "Build a Website with HTML & CSS",
    creator: "Life Tutorials",
    views: "143K views",
    published: "1 week ago",
    duration: "14:32",
  },
];

const TUTORIALS = [
  { label: "Intro to Figma", done: true },
  { label: "UI Design Basics", done: true },
  { label: "User Flows", done: false },
  { label: "Wireframing", done: false },
  { label: "Dark Mode UI", done: false },
];

function VideoCard({ video }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur">
      <div className="relative aspect-video overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${video.gradient}`} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_rgba(0,0,0,0.6))]" />
        <div className="absolute left-4 top-4 flex items-center gap-2 text-xs font-medium text-slate-100/80">
          <span className="rounded-full bg-black/40 px-3 py-1 uppercase tracking-wide">UI</span>
          <span className="rounded-full bg-black/40 px-3 py-1">{video.duration}</span>
        </div>
        <div className="absolute bottom-4 left-4 text-xs text-slate-200/80">
          <p>{video.creator}</p>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 px-5 py-4">
        <h3 className="text-lg font-semibold leading-snug text-white">{video.title}</h3>
        <div className="mt-auto flex items-center justify-between text-xs text-slate-400">
          <span>{video.views}</span>
          <span>{video.published}</span>
        </div>
      </div>
    </article>
  );
}

function LibraryRow({ item }) {
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-slate-200 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-base font-semibold text-white">{item.title}</p>
        <p className="text-xs uppercase tracking-wide text-slate-400">{item.creator}</p>
      </div>
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
        <span>{item.views}</span>
        <span>•</span>
        <span>{item.published}</span>
        <span>•</span>
        <span>{item.duration}</span>
      </div>
      <button className="btn-secondary text-xs font-semibold uppercase tracking-wide">Play</button>
    </div>
  );
}

export default function RoadView() {
  const sortedTags = useMemo(() => FILTER_TAGS, []);

  return (
    <div className="min-h-screen bg-[#05070F] text-white">
      <header className="border-b border-white/5 bg-[#060912]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-8">
            <span className="text-2xl font-bold brand-gradient">RoadView</span>
            <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
              {NAV_LINKS.map((link) => (
                <button
                  key={link}
                  className={`transition hover:text-white ${link === "Home" ? "text-white" : ""}`}
                >
                  {link}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <label className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
              <svg
                aria-hidden="true"
                className="h-4 w-4 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="m20 20-3.5-3.5M5 11a6 6 0 1 1 12 0 6 6 0 0 1-12 0Z"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                />
              </svg>
              <input
                className="w-full bg-transparent text-sm text-slate-200 placeholder-slate-500 focus:outline-none"
                placeholder="Search tutorials, labs, creators"
                type="search"
              />
            </label>
            <div className="flex items-center gap-3 self-end text-slate-400 md:self-auto">
              <button className="rounded-full border border-white/10 p-2 transition hover:bg-white/10" aria-label="Notifications">
                <span aria-hidden="true">🔔</span>
              </button>
              <button className="rounded-full border border-white/10 p-2 transition hover:bg-white/10" aria-label="Profile">
                <span aria-hidden="true">🜚</span>
              </button>
              <a className="btn-secondary text-xs font-semibold uppercase tracking-wide" href="/subscribe">
                Sign in
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-16 px-6 py-14">
        <section className="grid gap-10 lg:grid-cols-[1.65fr_1fr]">
          <div className="space-y-6">
            <article className="overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-[0_20px_60px_rgba(5,7,15,0.55)]">
              <div className="relative overflow-hidden border-b border-white/5">
                <div className="aspect-video bg-gradient-to-br from-[#081939] via-[#122E5A] to-[#1F4A7B]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.16),_rgba(0,0,0,0.75))]" />
                <div className="absolute left-6 top-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
                  <span className="rounded-full bg-black/40 px-3 py-1">Vid</span>
                  <span className="rounded-full bg-black/40 px-3 py-1">{FEATURED_VIDEO.duration}</span>
                </div>
              </div>
              <div className="space-y-6 px-6 pb-6 pt-6 md:px-8 md:pt-8">
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                  <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-slate-200">
                    RoadView Premiere
                  </span>
                  <span>{FEATURED_VIDEO.views}</span>
                  <span>•</span>
                  <span>{FEATURED_VIDEO.published}</span>
                </div>
                <div className="space-y-3">
                  <h1 className="text-3xl font-bold leading-tight text-white md:text-4xl">{FEATURED_VIDEO.title}</h1>
                  <p className="text-sm text-slate-300 md:text-base">{FEATURED_VIDEO.summary}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                  <span className="rounded-full bg-white/5 px-3 py-1 font-semibold text-slate-200">{FEATURED_VIDEO.creator}</span>
                  {FEATURED_VIDEO.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-white/5 px-3 py-1 text-[11px] uppercase tracking-wide text-slate-400">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-400">
                  <button className="btn">Play tutorial</button>
                  <button className="btn-secondary">Save to library</button>
                </div>
              </div>
              <div className="border-t border-white/5 px-6 py-4 text-xs text-slate-400 md:px-8">
                4 chapters · Motion cues · Lighting · Prototype walkthrough · Export to Lucidia
              </div>
            </article>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-slate-300">
                <h2 className="text-lg font-semibold text-white">Videos</h2>
                <button className="text-xs uppercase tracking-[0.3em] text-slate-500 hover:text-slate-300">
                  View all
                </button>
              </div>
              <div className="space-y-3">
                {PLAYLIST.map((item) => (
                  <div
                    key={item.title}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
                  >
                    <div>
                      <p className="font-semibold text-white">{item.title}</p>
                      <p className="text-xs text-slate-400">{item.channel}</p>
                    </div>
                    <div className="flex flex-col items-end text-xs text-slate-400">
                      <span>{item.meta}</span>
                      <span className="mt-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                        {item.duration}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <button className="w-full rounded-3xl bg-gradient-to-r from-[#1A2C65] via-[#2F4CB4] to-[#8A3FFC] px-6 py-4 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-[0_15px_40px_rgba(47,76,180,0.45)]">
              Import from Drive
            </button>

            <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-3 text-sm font-semibold text-white">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0F2B4D]">
                  <span aria-hidden="true" className="text-lg">📁</span>
                </div>
                <div>
                  <p>Google Drive</p>
                  <p className="text-xs font-normal text-slate-400">Connect account</p>
                </div>
              </div>
              <p className="text-sm text-slate-300">
                Sync your Lucidia exports, scripts, and storyboards straight from Drive into RoadView playlists.
              </p>
              <button className="btn-secondary w-full text-xs font-semibold uppercase tracking-wide">Connect</button>
            </div>

            <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">My Tutorials</h2>
              <ul className="space-y-3 text-sm text-slate-200">
                {TUTORIALS.map((item) => (
                  <li key={item.label} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                          item.done ? "border-emerald-400 bg-emerald-500/20 text-emerald-300" : "border-white/20 text-slate-500"
                        }`}
                      >
                        {item.done ? "✓" : ""}
                      </span>
                      <span>{item.label}</span>
                    </div>
                    {item.done && (
                      <span className="text-xs uppercase tracking-[0.3em] text-emerald-400">Done</span>
                    )}
                  </li>
                ))}
              </ul>
              <button className="btn w-full">Staked secret</button>
            </div>
          </aside>
        </section>

        <section className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">RoadView Picks</p>
              <h2 className="text-2xl font-semibold text-white">Recommended</h2>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {sortedTags.map((tag) => (
                <button
                  key={tag}
                  className={`rounded-full border border-white/10 px-3 py-1 transition ${
                    tag === "Recommended" ? "bg-white/10 text-white" : "text-slate-300 hover:text-white"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {RECOMMENDED_VIDEOS.map((video) => (
              <VideoCard key={video.title} video={video} />
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Library</p>
            <h2 className="text-2xl font-semibold text-white">Keep the streak going</h2>
          </div>
          <div className="space-y-4">
            {LIBRARY_ROWS.map((item) => (
              <LibraryRow key={item.title} item={item} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
