"use client";
import { useCoAgent, useCoAgentStateRender } from "@copilotkit/react-core";

export default function CoAgentSkeleton() {
  const { agentState } = useCoAgent({
    name: "lucidia_agent",
    initialState: { input: "hello" },
    // Backend wiring for LangGraph/AG-UI happens server-side; this is the UI binding.
  });

  useCoAgentStateRender({
    name: "lucidia_agent",
    render: ({ state }) => (
      <div className="p-3 border rounded-lg">
        <div className="text-xs opacity-70">Agent state</div>
        <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(state, null, 2)}</pre>
      </div>
    ),
  });

  return null;
}
