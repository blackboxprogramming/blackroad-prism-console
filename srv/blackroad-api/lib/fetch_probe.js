const logger = require('./log');
const { redactHeaders, redactPayload, truncateString } = require('./redact');

const DEBUG_DEFAULT =
  String(process.env.DEBUG_MODE || process.env.DEBUG_PROBES || 'false').toLowerCase() ===
  'true';

function normalizeHeaders(initHeaders) {
  if (!initHeaders) return {};
  if (typeof Headers !== 'undefined' && initHeaders instanceof Headers) {
    return Object.fromEntries(initHeaders.entries());
  }
  if (Array.isArray(initHeaders)) {
    return Object.fromEntries(initHeaders);
  }
  return Object.fromEntries(
    Object.entries(initHeaders).map(([key, value]) => [key, value])
  );
}

function extractRequestInfo(input, init = {}) {
  if (typeof input === 'string') {
    return { url: input, method: init.method || 'GET' };
  }
  if (input && typeof input === 'object' && 'url' in input) {
    return { url: input.url, method: init.method || input.method || 'GET' };
  }
  return { url: String(input), method: init.method || 'GET' };
}

function coerceBody(body) {
  if (!body) return undefined;
  if (typeof body === 'string') return truncateString(body, 1024);
  if (Buffer.isBuffer(body)) return truncateString(body.toString('utf8'), 1024);
  if (typeof body === 'object') return redactPayload(body);
  return '[unsupported-body]';
}

async function fetchWithProbe(input, init = {}, options = {}) {
  const {
    enabled = DEBUG_DEFAULT,
    logger: customLogger = logger,
    label = 'fetch_probe',
    maxBodyLength = 2048,
  } = options;

  if (!enabled) {
    return fetch(input, init);
  }

  const start = Date.now();
  const info = extractRequestInfo(input, init);
  const headers = normalizeHeaders(init.headers || (input && input.headers));
  const requestSnapshot = {
    label,
    url: info.url,
    method: info.method,
    headers: redactHeaders(headers),
    body: coerceBody(init.body),
  };

  customLogger.debug({ event: 'fetch_probe_request', ...requestSnapshot });

  try {
    const response = await fetch(input, init);
    const responseHeaders = Object.fromEntries(response.headers.entries());
    const isStreamingBody =
      response.body != null &&
      (typeof response.body.getReader === 'function' ||
        typeof response.body.pipe === 'function') &&
      !responseHeaders['content-length'];

    let bodyPreview;
    if (isStreamingBody) {
      bodyPreview = '[streaming-body-skipped]';
    } else {
      try {
        const clone = response.clone();
        const text = await clone.text();
        bodyPreview = truncateString(text, maxBodyLength);
      } catch (err) {
        bodyPreview = `[body-unavailable: ${err?.message || 'unknown'}]`;
      }
    }

    customLogger.debug({
      event: 'fetch_probe_response',
      label,
      url: info.url,
      status: response.status,
      ok: response.ok,
      durationMs: Date.now() - start,
      headers: redactHeaders(responseHeaders),
      body: bodyPreview,
    });

    return response;
  } catch (error) {
    customLogger.error({
      event: 'fetch_probe_error',
      label,
      url: info.url,
      durationMs: Date.now() - start,
      error: error && error.message ? error.message : String(error),
    });
    throw error;
  }
}

module.exports = { fetchWithProbe };
