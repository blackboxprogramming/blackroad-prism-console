export default function Page() {
  return (
    <>
      <section className="container-x py-16 sm:py-24">
        <div className="max-w-3xl">
          <p className="mb-3 text-sm tracking-wide text-zinc-400">HELLO, WORLD!</p>
          <h1 className="h1">
            Build, ship, and evolve — on a{" "}
            <span className="bg-gradient-to-r from-pink-500 via-fuchsia-500 to-orange-400 bg-clip-text text-transparent">
              dark, precise
            </span>{" "}
            stack.
          </h1>
          <p className="mt-5 text-lg text-zinc-400">
            A developer-focused environment for real-time co-coding, agents, and automation.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a className="btn-primary" href="/portal">Launch Portal</a>
            <a className="btn-ghost" href="/#docs">Read the Docs</a>
            <a className="btn-ghost" href="/#investor">Investor Relations</a>
          </div>
        </div>
      </section>
    </>
  );
}
