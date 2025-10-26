import { spawn } from "node:child_process";
import process from "node:process";

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", ...options });
    child.on("exit", (code) => {
      if (code === 0) {
        resolve(undefined);
      } else {
        reject(new Error(`${command} exited with code ${code}`));
      }
    });
    child.on("error", reject);
  });
}

async function waitForServer(url, attempts = 20) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch (error) {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Server at ${url} did not become ready in time`);
}

async function main() {
  await run("pnpm", ["run", "build"], { cwd: process.cwd(), stdio: "inherit" });
  const server = spawn("pnpm", ["run", "start", "--", "-p", "3000"], {
    cwd: process.cwd(),
    stdio: "inherit"
  });

  try {
    await waitForServer("http://localhost:3000");
    await run("pnpm", ["exec", "linkinator", "http://localhost:3000", "--timeout=10000", "--skip=external"], {
      cwd: process.cwd(),
      stdio: "inherit"
    });
  } finally {
    server.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
