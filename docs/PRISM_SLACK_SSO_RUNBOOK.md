# PRISM Slack SSO Flow

Goal: allow users to sign in with Slack instead of the magic link flow.

## 1. Create the Slack App
- **Name**: `PRISM SSO`
- **Feature**: Enable **OAuth & Permissions** and add redirect URL `https://app.blackroad.io/auth/slack/callback`.
- **Scopes**: `identity.basic`, `identity.email`.

## 2. Configure in PRISM
- Store the Slack **Client ID** and **Client Secret** in 1Password (Vault: *Engineering*).
- Add the provider to `NEXTAUTH_PROVIDERS` (or the equivalent in the auth middleware) using the stored credentials.

## 3. User Flow
1. User clicks **Sign in with Slack**.
2. Slack consent screen renders.
3. Slack redirects to the callback URL.
4. PRISM creates a session.
5. Map the Slack email to an existing org membership, inviting the user if it is their first time.

## 4. Testing Checklist
- Run through the flow in a clean browser profile.
- Confirm a new row is created in the `users` table after first-time sign-in.
- Validate error handling for denied consent and email domain mismatches.

## 5. Security Notes
- Rotate the Slack app secrets annually (set a calendar reminder).
- Restrict allowed email domains if required for tenant controls.
