import React from "react";
import QuickLaunch from "./QuickLaunch";
import MissionBuilder from "./MissionBuilder";

const DEFAULT_API = "/codex_prompts";
const API = globalThis?.MISSION_BUILDER_API ?? DEFAULT_API;

export default function App() {
  return (
    <main>
      <section className="grid">
        <QuickLaunch api={API} />
        <MissionBuilder api={API} />
      </section>
    </main>
  );
}
