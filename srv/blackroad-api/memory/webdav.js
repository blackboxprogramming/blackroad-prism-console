'use strict';

const { URL } = require('url');

const DEFAULT_TIMEOUT = 7000;

function sanitizeSegment(segment) {
  return segment
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);
}

function isoTimestamp(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, '-');
}

class WebDavClient {
  constructor({
    baseUrl,
    username,
    password,
    timeoutMs = DEFAULT_TIMEOUT,
    fetchImpl = global.fetch,
    logger = console,
  }) {
    if (!baseUrl) {
      throw new Error('WebDAV baseUrl is required');
    }

    this.baseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    this.username = username;
    this.password = password;
    this.timeoutMs = timeoutMs;
    this.fetch = fetchImpl;
    this.logger = logger;
    this.ensurePromise = null;
    this.lastStatus = {
      ok: false,
      lastSuccessAt: null,
      lastError: null,
    };

    if (typeof this.fetch !== 'function') {
      throw new Error('A fetch implementation is required for WebDavClient');
    }
  }

  authHeader() {
    if (typeof this.username !== 'string' || typeof this.password !== 'string') {
      return {};
    }

    const encoded = Buffer.from(`${this.username}:${this.password}`, 'utf8').toString('base64');
    return { Authorization: `Basic ${encoded}` };
  }

  async request(url, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetch(url, {
        ...options,
        headers: {
          ...this.authHeader(),
          ...(options.headers || {}),
        },
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeout);
    }
  }

  async ensureCollection() {
    if (this.ensurePromise) {
      return this.ensurePromise;
    }

    this.ensurePromise = this.#ensureCollectionInternal();
    return this.ensurePromise;
  }

  async #ensureCollectionInternal() {
    const url = new URL(this.baseUrl);
    const origin = `${url.protocol}//${url.host}`;
    const parts = url.pathname.replace(/^\/+|\/+$/g, '').split('/');

    if (!parts[0]) {
      return true;
    }

    let currentPath = '';
    for (const part of parts) {
      currentPath += `${part}/`;
      const target = `${origin}/${currentPath}`;

      try {
        const propfind = await this.request(target, {
          method: 'PROPFIND',
          headers: { Depth: '0' },
        });

        if (propfind.status === 207 || propfind.status === 200) {
          continue;
        }

        if (propfind.status === 404) {
          const mkcol = await this.request(target, { method: 'MKCOL' });
          if (![201, 405, 409].includes(mkcol.status)) {
            throw new Error(`MKCOL failed for ${target} (status ${mkcol.status})`);
          }
          continue;
        }

        if (propfind.status === 401) {
          throw new Error('WebDAV authentication failed while ensuring collection');
        }
      } catch (error) {
        this.lastStatus = {
          ok: false,
          lastSuccessAt: this.lastStatus.lastSuccessAt,
          lastError: error,
        };
        throw error;
      }
    }

    return true;
  }

  buildFilename(entry) {
    const timestamp = isoTimestamp(entry.created_at ? new Date(entry.created_at) : new Date());
    const parts = [];
    if (entry.join_code) {
      parts.push(entry.join_code);
    }
    if (entry.source) {
      parts.push(entry.source);
    }
    if (!parts.length && Array.isArray(entry.tags) && entry.tags.length) {
      parts.push(entry.tags[0]);
    }
    const descriptor = parts.join('-') || 'memory';
    const sanitized = sanitizeSegment(descriptor) || 'memory';
    return `${timestamp}_${sanitized}.jsonl`;
  }

  buildBody(entry) {
    const payload = {
      ...entry,
      created_at: entry.created_at || new Date().toISOString(),
    };
    return `${JSON.stringify(payload)}\n`;
  }

  async storeEntry(entry) {
    await this.ensureCollection();

    const filename = this.buildFilename(entry);
    const targetUrl = new URL(filename, this.baseUrl).toString();

    try {
      const response = await this.request(targetUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: this.buildBody(entry),
      });

      if (!response.ok) {
        throw new Error(`WebDAV PUT failed (${response.status})`);
      }

      this.lastStatus = {
        ok: true,
        lastSuccessAt: new Date().toISOString(),
        lastError: null,
      };
      return filename;
    } catch (error) {
      this.lastStatus = {
        ok: false,
        lastSuccessAt: this.lastStatus.lastSuccessAt,
        lastError: error,
      };
      throw error;
    }
  }

  async list(depth = 1) {
    await this.ensureCollection();

    const response = await this.request(this.baseUrl, {
      method: 'PROPFIND',
      headers: { Depth: String(depth) },
    });

    if (!response.ok && response.status !== 207) {
      throw new Error(`WebDAV PROPFIND failed (${response.status})`);
    }

    const text = await response.text();
    return text;
  }

  getStatus() {
    const { ok, lastSuccessAt, lastError } = this.lastStatus;
    return {
      ok,
      lastSuccessAt,
      lastError: lastError ? lastError.message || String(lastError) : null,
      baseUrl: this.baseUrl,
      timeoutMs: this.timeoutMs,
    };
  }
}

module.exports = {
  WebDavClient,
  sanitizeSegment,
  isoTimestamp,
};
