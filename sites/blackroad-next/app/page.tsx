import type { Metadata } from 'next';

const idpDomain = process.env.NEXT_PUBLIC_IDP_DOMAIN ?? "id.blackroadinc.us";
const clientId = process.env.NEXT_PUBLIC_IDP_CLIENT_ID;
const redirectUri = process.env.NEXT_PUBLIC_IDP_REDIRECT ?? "https://blackroadinc.us/auth/callback";
const scope = process.env.NEXT_PUBLIC_IDP_SCOPE ?? "openid email profile";
const authorizePath = process.env.NEXT_PUBLIC_IDP_AUTHORIZE_PATH ?? "oauth2/default/v1/authorize";
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.blackroad.io";
const statusUrl = process.env.NEXT_PUBLIC_STATUS_URL ?? "https://status.blackroad.io";
const magicLinkUrl = process.env.NEXT_PUBLIC_MAGIC_LINK_URL;
const contact = process.env.NEXT_PUBLIC_ACCESS_EMAIL ?? "ops@blackroadinc.us";

const contactHref = contact.startsWith('mailto:') || !contact.includes('@')
  ? contact
  : `mailto:${contact}`;

const buildAuthorizeUrl = (forcePrompt = false) => {
  if (!clientId) {
    const loginUrl = new URL(`https://${idpDomain}/login/login.htm`);
    loginUrl.searchParams.set('fromURI', '/app/UserHome');
    if (forcePrompt) {
      loginUrl.searchParams.set('prompt', 'login');
    }
    return loginUrl.toString();
  }

  const authorizeUrl = new URL(`https://${idpDomain}/${authorizePath}`);
  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('scope', scope);
  if (forcePrompt) {
    authorizeUrl.searchParams.set('prompt', 'login');
  }
  return authorizeUrl.toString();
};

const primarySsoUrl = buildAuthorizeUrl();
const companyAccountUrl = buildAuthorizeUrl(true);
const emailMagicLinkUrl = magicLinkUrl ?? contactHref;

export const metadata: Metadata = {
  title: "Login",
  description: "Central login hub for all BlackRoad environments.",
  alternates: { canonical: "https://blackroadinc.us/" },
  openGraph: {
    title: "BlackRoad Hub — Login",
    description: "Central login hub for all BlackRoad environments.",
    url: "https://blackroadinc.us/",
  },
  twitter: {
    card: "summary_large_image",
    title: "BlackRoad Hub — Login",
    description: "Central login hub for all BlackRoad environments.",
  },
};

export default function Page() {
  return (
    <>
      <div className="hub-page">
        <main className="hub-card">
          <h1>BlackRoad</h1>
          <p className="hub-lead">Central login for all environments.</p>

          <a className="hub-btn primary" href={primarySsoUrl}>
            Sign in with SSO
          </a>

          <div className="hub-row">
            <a className="hub-btn" href={companyAccountUrl}>
              Use Company Account
            </a>
            <a className="hub-btn" href={emailMagicLinkUrl}>
              Email Magic Link
            </a>
          </div>

          <div className="hub-row">
            <a className="hub-btn" href={appUrl}>
              Go to App
            </a>
            <a className="hub-btn" href={statusUrl}>
              Status
            </a>
          </div>

          <div className="hub-muted">
            Need access? Contact: <a href={contactHref}>{contact.replace(/^mailto:/, "")}</a>
          </div>
        </main>
      </div>
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
