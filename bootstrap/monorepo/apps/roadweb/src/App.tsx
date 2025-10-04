import { useEffect, useMemo, useState } from "react";

const DEFAULT_RPC = "http://localhost:8545";

type BlockResponse = {
  result?: string;
  error?: {
    message: string;
  };
};

async function fetchBlockNumber(rpcUrl: string): Promise<string> {
  try {
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_blockNumber",
        params: [],
        id: 1
      })
    });

    const payload = (await response.json()) as BlockResponse;
    if (payload.error) {
      throw new Error(payload.error.message);
    }
    if (!payload.result) {
      throw new Error("Missing block number in response");
    }
    return parseInt(payload.result, 16).toString();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to reach devnet: ${error.message}`);
    }
    throw new Error("Unknown error while fetching devnet block number");
  }
}

export function App(): JSX.Element {
  const [blockNumber, setBlockNumber] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Connecting to devnet…");

  const rpcUrl = useMemo(() => {
    return import.meta.env.VITE_ANVIL_RPC ?? DEFAULT_RPC;
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchBlockNumber(rpcUrl)
      .then((number) => {
        if (cancelled) {
          return;
        }
        setBlockNumber(number);
        setStatus("Devnet reachable");
      })
      .catch((error: Error) => {
        if (cancelled) {
          return;
        }
        setStatus(error.message);
      });

    return () => {
      cancelled = true;
    };
  }, [rpcUrl]);

  return (
    <main className="app">
      <header>
        <h1>RoadWeb Hello World</h1>
        <p className="subtitle">Bootstrapped Vite + React client for the RoadChain stack.</p>
      </header>

      <section className="status">
        <h2>Devnet Status</h2>
        <p data-testid="status">{status}</p>
        {blockNumber && (
          <p data-testid="block">Latest block: {blockNumber}</p>
        )}
      </section>

      <section className="checklist">
        <h2>Next steps</h2>
        <ol>
          <li>Run <code>make devnet-up</code> to start Anvil and RoadWeb containers.</li>
          <li>Update <code>VITE_ANVIL_RPC</code> in <code>.env.local</code> if you point to a remote RPC.</li>
          <li>Build your first component in <code>src/</code> and add vitest coverage.</li>
          <li>Wire contracts by importing ABIs from <code>packages/roadcoin</code>.</li>
        </ol>
      </section>
    </main>
  );
}

export default App;
