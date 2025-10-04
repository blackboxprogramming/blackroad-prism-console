import fetch from 'node-fetch';
import { StripeCharge, StripeSubscription, StripeSubscriptionItem } from './types.js';

const BASE = 'https://api.stripe.com/v1';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function encodeParams(params: Record<string, any>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      value.forEach((v) => search.append(key, String(v)));
    } else if (typeof value === 'object') {
      for (const [subKey, subVal] of Object.entries(value)) {
        if (subVal === undefined || subVal === null) continue;
        search.append(`${key}[${subKey}]`, String(subVal));
      }
    } else {
      search.append(key, String(value));
    }
  }
  return search.toString();
}

async function getJSON<T>(path: string, token: string, params: Record<string, any> = {}, attempt = 0): Promise<T> {
  const query = encodeParams({ ...params, limit: params.limit ?? 100 });
  const url = `${BASE}${path}${query ? `?${query}` : ''}`;
  const resp = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (resp.ok) {
    return (await resp.json()) as T;
  }
  const retryAfter = resp.headers.get('retry-after');
  const status = resp.status;
  if ((status === 429 || status >= 500) && attempt < 5) {
    let delayMs = Math.min(2 ** attempt * 500, 10_000);
    if (retryAfter) {
      const retrySeconds = Number(retryAfter);
      if (!Number.isNaN(retrySeconds)) {
        delayMs = retrySeconds * 1000;
      }
    }
    await sleep(delayMs);
    return getJSON<T>(path, token, params, attempt + 1);
  }
  const text = await resp.text();
  throw new Error(`stripe_request_failed:${status}:${text}`);
}

export async function* listPaginated<T extends { data: { id: string }[]; has_more: boolean }>(
  path: string,
  token: string,
  params: Record<string, any> = {}
): AsyncGenerator<T['data'], void, unknown> {
  let startingAfter: string | undefined;
  while (true) {
    const body = await getJSON<T>(path, token, {
      ...params,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    const items = body.data || [];
    if (!items.length) {
      break;
    }
    yield items;
    if (!body.has_more) {
      break;
    }
    startingAfter = items[items.length - 1].id;
  }
}

export const listCharges = (token: string, params: Record<string, any>) =>
  listPaginated<{ data: StripeCharge[]; has_more: boolean }>(`/charges`, token, params);

export const listSubscriptions = (token: string, params: Record<string, any>) =>
  listPaginated<{ data: StripeSubscription[]; has_more: boolean }>('/subscriptions', token, params);

export async function getSubscriptionItems(token: string, subscriptionId: string) {
  const items: StripeSubscriptionItem[] = [];
  for await (const page of listPaginated<{ data: StripeSubscriptionItem[]; has_more: boolean }>(
    '/subscription_items',
    token,
    { subscription: subscriptionId }
  )) {
    items.push(...page);
  }
  return items;
}
