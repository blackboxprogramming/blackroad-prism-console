export interface AuthClientConfig {
  baseURL: string;
  fetchImpl?: typeof fetch;
}

export interface SignupRequest {
  email: string;
  password: string;
}

export interface SignupResponse {
  user: {
    id: string;
    email: string;
    createdAt: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
  fingerprint?: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface VerifyResponse {
  valid: boolean;
  sub?: string;
  scope?: string;
  iat?: number;
  exp?: number;
  iss?: string;
  jti?: string;
  kid?: string;
  reason?: string;
}

export interface RefreshRequest {
  refreshToken?: string;
  fingerprint?: string;
}

export interface VerifyRequest {
  token?: string;
}

export interface LogoutRequest {
  refreshToken?: string;
}

async function request<T>(
  baseURL: string,
  path: string,
  init: RequestInit,
  fetchImpl: typeof fetch
): Promise<T> {
  const response = await fetchImpl(`${baseURL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {})
    }
  });
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}

export function createAuthClient(config: AuthClientConfig) {
  const fetchImpl = config.fetchImpl ?? fetch;
  return {
    signup: (payload: SignupRequest) =>
      request<SignupResponse>(config.baseURL, '/signup', {
        method: 'POST',
        body: JSON.stringify(payload)
      }, fetchImpl),
    login: (payload: LoginRequest) =>
      request<TokenResponse>(config.baseURL, '/login', {
        method: 'POST',
        body: JSON.stringify(payload)
      }, fetchImpl),
    verify: (payload: VerifyRequest = {}, options: { bearerToken?: string } = {}) =>
      request<VerifyResponse>(config.baseURL, '/tokens/verify', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: options.bearerToken
          ? { Authorization: `Bearer ${options.bearerToken}` }
          : undefined
      }, fetchImpl),
    refresh: (payload: RefreshRequest = {}, options: { bearerToken?: string } = {}) =>
      request<TokenResponse>(config.baseURL, '/tokens/refresh', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: options.bearerToken
          ? { Authorization: `Bearer ${options.bearerToken}` }
          : undefined
      }, fetchImpl),
    logout: (payload: LogoutRequest = {}, options: { bearerToken?: string } = {}) =>
      request<{ ok: boolean }>(config.baseURL, '/logout', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: options.bearerToken
          ? { Authorization: `Bearer ${options.bearerToken}` }
          : undefined
      }, fetchImpl)
  };
}
