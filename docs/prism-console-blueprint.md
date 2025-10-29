# Prism Console Blueprint Addendum

This addendum captures compile-time wiring, policy enforcement, scope handling, tool execution, and consent lifecycles for the Prism Console. It refines the previous blueprint with concrete Go-first patterns that keep toggles and guardrails consistent across binaries.

## 1. Compile-Time Controls ("Pragma" Usage)

Go does not rely on a standalone pragma module; instead it uses build tags and directive comments. Centralize these patterns to avoid repetition across server, worker, and CLI entry points.

### 1.a Build Tags for Provider Wiring

```go
// file: internal/wire/cloud_enabled.go
//go:build cloud

package wire

import "yourapp/internal/tools/cloud"

func ProvideCloud() (Tool, bool) { return cloud.AskCloud{}, true }
```

```go
// file: internal/wire/cloud_disabled.go
//go:build !cloud

package wire

func ProvideCloud() (Tool, bool) { return nil, false }
```

### 1.b Compile-Time Policy Guard

```go
// file: internal/policy/ensure.go
package policy

var _ = func() any {
    // Fail fast at build if required env build tag is missing
    // (use go:build flags across environments)
    return nil
}()
```

### 1.c Optional `//go:generate` Registry Refresh

```go
//go:generate go run ./cmd/gen-tools -out=internal/tools/registry_gen.go
```

## 2. Authorization Mirroring (Role + Proof + Classification)

Unify authorization logic so all endpoints delegate to one guard that understands role inheritance, identity proof, and data classification gates.

```go
// file: internal/authz/authz.go
type Action string

const (
    ActMirror   Action = "mirror"
    ActPRCreate Action = "pr.create"
    ActFetch    Action = "fetch"
)

type Scope struct {
    OrgID  string
    RepoID string
    Path   string // optional (glob-able)
    Class  string // public|internal|restricted|secret
}

type Principal struct {
    UserID string
    Roles  []string // org/repo-scoped role ids resolved earlier
    Proof  struct {
        GithubUser string
        Verified   bool
    }
}

type Policy interface {
    Allow(p Principal, a Action, s Scope) (bool, string) // allowed, reason
}

func (rbac RBAC) Allow(p Principal, a Action, s Scope) (bool, string) {
    if !p.Proof.Verified && a == ActPRCreate {
        return false, "missing_identity"
    }
    role := rbac.highestRole(p, s) // org > repo > path inheritance
    if !rbac.roleAllows(role, a) {
        return false, "insufficient_role"
    }
    limit := rbac.orgMirrorLimit(s.OrgID) // e.g., up to "internal"
    if rank(s.Class) > rank(limit) {
        return false, "classification_block"
    }
    if !rbac.pathAllowed(s.OrgID, s.RepoID, s.Path) {
        return false, "pattern_block"
    }
    return true, ""
}
```

## 3. Fine-Grained Grants

Model grants so the UI can offer narrower access than provider defaults and intersect scopes at call time.

```sql
CREATE TABLE grants (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  provider VARCHAR(24) NOT NULL,
  scopes TEXT NOT NULL,
  org_id VARCHAR(128) NULL,
  repo_id VARCHAR(128) NULL,
  path_globs TEXT NULL,
  granted_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NULL,
  status ENUM('active','revoked','expired','paused') NOT NULL DEFAULT 'active'
);
```

```go
func Need(provider string, want []string, s Scope, p Principal) error {
    g := db.SelectGrant(p.UserID, provider, s.OrgID, s.RepoID)
    if !containsAll(g.scopes, want) {
        return ErrConsentEscalation
    }
    if g.path_globs != "" && !matchAny(s.Path, parseGlobs(g.path_globs)) {
        return ErrScopeTooNarrow
    }
    return nil
}
```

## 4. Tool Runner with Delegation

Expose a compact interface so local tools and cloud-backed executors share a contract.

```go
// file: internal/tools/tools.go
type Tool interface {
    Name() string
    Capabilities() []string
    Exec(ctx context.Context, req map[string]any) (map[string]any, error)
}

type Runner struct {
    Tools      map[string]Tool
    Reputation func(tool string) int // 0..100
    FloorByOrg func(org string) int
}

func (r Runner) Run(ctx context.Context, tool string, req map[string]any) (map[string]any, error) {
    if r.Reputation(tool) < r.FloorByOrg(req["org"].(string)) {
        return nil, ErrToolUntrusted
    }
    return r.Tools[tool].Exec(ctx, req)
}

// Adapter for ask_cloud
type AskCloud struct{}

func (a AskCloud) Name() string { return "cloud.ask" }

func (a AskCloud) Capabilities() []string { return []string{"mirror", "fetch", "pr.create"} }

func (a AskCloud) Exec(ctx context.Context, req map[string]any) (map[string]any, error) {
    return callCloud(ctx, req)
}
```

## 5. Consent Ledger

Separate grants from consents to maintain clean audit trails.

```sql
CREATE TABLE consents (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  provider VARCHAR(24) NOT NULL,
  scope_set_hash CHAR(64) NOT NULL,
  purpose TEXT NOT NULL,
  granted_at TIMESTAMP NOT NULL,
  last_used_at TIMESTAMP NULL,
  expires_at TIMESTAMP NULL,
  status ENUM('active','revoked','expired','paused') NOT NULL DEFAULT 'active'
);

CREATE TABLE consent_events (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  consent_id BIGINT NOT NULL,
  event ENUM('granted','escalated','used','paused','revoked','expired') NOT NULL,
  at TIMESTAMP NOT NULL,
  reason TEXT NULL
);
```

## 6. Capability Requirements and Sandbox Policy

Tie PR operations to artifact availability and sandbox approval.

```go
type Capability string

const (
    CapNeedsFiles Capability = "needs_files"
    CapNeedsExec  Capability = "needs_exec"
)

type Requirement struct {
    Cap      Capability
    Sandbox  string // "none" | "container" | "vm"
}

func Ensure(req Requirement, s Scope, p Principal) error {
    switch req.Cap {
    case CapNeedsFiles:
        if !artifactStore.Exists(s.RepoID, s.Path) {
            return ErrMissingArtifact
        }
    case CapNeedsExec:
        if !sandbox.Allowed(p.UserID, s.OrgID) {
            return ErrExecNotAllowed
        }
    }
    return nil
}

var schemaPRCreate = map[string]string{
    "repo":   "string,nonempty",
    "title":  "string,<=120",
    "body":   "string,<=20000",
    "branch": "string,pattern=^[\\w.-/]+$",
}
```

## 7. Stable Secrets with Brokered Access

Do not alter the existing secrets table. Add policy enforcement and auditing via a broker layer.

```go
func GetSecret(ctx context.Context, id string, purpose string) (string, error) {
    if !policy.SecretAllowed(ctxUser(ctx), id, purpose) {
        return "", ErrSecretNotAllowed
    }
    value := secrets.Read(id)
    audit.Log(ctx, "secret.read", map[string]any{"id": id, "purpose": purpose})
    return value, nil
}
```

## 8. Actionable Error Responses

Standardize error payloads so the client can guide users toward resolution.

```json
{
  "error": {
    "code": "missing_identity",
    "message": "Link GitHub to create pull requests.",
    "next_steps": [
      {"label": "Connect GitHub", "action": "open_oauth", "provider": "github"},
      {"label": "Use read-only summary instead", "action": "use_tool", "tool": "github.pr_summary"}
    ],
    "correlation_id": "req_9K3M"
  }
}
```

## 9. End-to-End Wiring Flow

1. Webhook arrives → normalize → enqueue job.
2. Job resolves principal + scope → `authorize()` (role + class + path + proof).
3. `Need()` checks narrow consent (prompt if escalation required).
4. `Runner.Run()` picks tool (reputation floor) → executes (`AskCloud` or local).
5. Audit trail stores who/what/why/outcome; UI surfaces context (“Why you’re seeing this”).

These layers keep compile-time toggles, mirroring policy, consent management, tool execution, and secrets handling cohesive without introducing runtime drag.

## 10. Black Road Onboarding Sequence

Codify the initial handshake for Prism Console invitees so the ceremony is replayable, auditable, and policy enforced.

1. **Signal Intake** – Accept a 256-character onboarding token via a trusted channel. Persist the payload in `onboarding_tokens` (status=`pending`, checksum, issuer, issued_at) and emit an audit event `onboarding.token_received`.
2. **Reciprocal Consent Prompt** – Render a dual acknowledgement screen where both the operator (`operator_ack`) and invitee (`invitee_ack`) consent to the activation terms. Store acknowledgements alongside the token record and halt progression until both values resolve to true.
3. **Identity Binding** – Resolve the invitee identity (user id, service id, or automation id) and capture declared capabilities. Enforce `Runner.Reputation(tool) >= FloorByOrg(org)` before persisting capabilities. Record the binding with `onboarding_bindings` referencing the original token and invitee identifier.
4. **First Task Bootstrap** – Auto-issue the starter command `calibrate prism console status` through the agent command bus (`POST /api/agents/command`). Link the command id back to the onboarding record and queue the job for execution.
5. **Auditable Closure** – Mark the onboarding token as `consumed_at=timestamp` and append a summary event `onboarding.handshake_complete` containing the acknowledgements, identity binding, issued command id, and final status for replayability.

This sequence ensures every invitee enters the Black Road with explicit consent, verified capability bindings, and an actionable first command that can be audited end-to-end.
Codify the “invite + consent” ceremony so external collaborators—human or AI—can join the Prism Console without ad-hoc steps.

1. **Signal Intake** – Accept a 256-character onboarding token (Caesar-shifted or otherwise). Verify format/entropy, then persist it in the consent ledger as a `pending` artifact linked to the inviter.
2. **Reciprocal Consent Prompt** – Present a dual-acknowledgement screen: operator affirms scope, invitee affirms readiness. Both confirmations write `consent_events` with `reason` values (`operator_ack`, `invitee_ack`).
3. **Identity Binding** – Resolve the invitee to a principal (user id or service id). For AI collaborators, store declared capabilities and guard them with `Runner.Reputation` minimums derived from the inviter’s org policy.
4. **First Task Bootstrap** – Auto-issue a starter command (e.g., “calibrate prism console status”) through `POST /api/agents/command`. This proves queue wiring and gives the invitee their first actionable step on the Black Road.
5. **Auditable Closure** – Once the bootstrap command completes, mark the onboarding token as `used` and emit a summary event into `consent_events` so future reviewers can replay the entire handshake.

This scripted loop turns narrative rituals—like exchanging ciphered strings and explicit consent—into durable, auditable flows inside the Prism Console.
