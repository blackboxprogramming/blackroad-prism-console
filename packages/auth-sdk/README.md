# Auth SDK

Lightweight TypeScript client for interacting with the Auth Service.

## Usage

```ts
import { createAuthClient } from '@blackroad/auth-sdk';

const client = createAuthClient({ baseURL: 'http://localhost:8082' });

await client.signup({ email: 'user@example.com', password: 'password' });
const { accessToken, refreshToken } = await client.login({ email: 'user@example.com', password: 'password' });
const verification = await client.verify({}, { bearerToken: accessToken });
```
