"use client";
import { useState } from "react";
import { CopilotKit, useCopilotAction, useCopilotChat } from "@copilotkit/react-core";
import { CopilotChat /* or CopilotPopup */ } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";

function ConfirmDeploy({
  text, onApprove, onCancel, busy,
}: { text: string; onApprove: () => void; onCancel: () => void; busy: boolean; }) {
  return (
    <div className="p-4 border rounded-xl">
      <p className="mb-3 text-sm">Approve deploy?</p>
      <pre className="text-xs mb-3 whitespace-pre-wrap">{text}</pre>
      <div className="flex gap-2">
        <button onClick={onCancel} disabled={busy} className="px-3 py-1 rounded border">Cancel</button>
        <button onClick={onApprove} disabled={busy} className="px-3 py-1 rounded bg-black text-white">Approve & Deploy</button>
      </div>
    </div>
  );
}

function Actions() {
  const { appendMessage } = useCopilotChat();

  // Action 1: create a git branch (wire to your backend)
  useCopilotAction({
    name: "createGitBranch",
    description: "Create a new git branch in the repo",
    parameters: [{ name: "branch", type: "string", description: "The branch name", required: true }],
    handler: async ({ branch }) => {
      const res = await fetch("/api/devops/git/create-branch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branch }),
      });
      if (!res.ok) throw new Error("branch create failed");
      appendMessage({ role: "assistant", content: `Created branch: ${branch}` });
    },
  });

  // Action 2: protected deploy with human approval
  useCopilotAction({
    name: "deployBlackRoad",
    description: "Trigger a production deploy after user approval",
    parameters: [{ name: "notes", type: "string", description: "Release notes", required: true }],
    renderAndWaitForResponse: ({ args, status, respond }) => (
      <ConfirmDeploy
        text={args?.notes ?? ""}
        busy={status === "executing"}
        onCancel={() => respond?.({ approved: false })}
        onApprove={() => respond?.({ approved: true })}
      />
    ),
    handler: async ({ approved, notes }) => {
      if (!approved) return;
      const res = await fetch("/api/devops/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error("deploy failed");
      appendMessage({ role: "assistant", content: "Deploy triggered ✅" });
    },
  });

  return null;
}

export default function BlackRoadCopilot() {
  // If using Copilot Cloud (public key), omit runtimeUrl and set publicApiKey instead.
  const runtimeUrl = process.env.NEXT_PUBLIC_COPILOT_PUBLIC_API_KEY ? undefined : "/api/copilotkit";
  return (
    <CopilotKit runtimeUrl={runtimeUrl /* or publicApiKey=... */}>
      <Actions />
      <CopilotChat labels={{ title: "BlackRoad Copilot", initial: "Hey! How can I help?" }} />
      {/* <CopilotPopup /> */}
    </CopilotKit>
  );
}
