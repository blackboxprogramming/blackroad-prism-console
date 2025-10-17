'use strict';

const http = require('http');
const https = require('https');
const { URL } = require('url');

class JiraClient {
  constructor({ baseUrl, authHeader, timeoutMs = 10_000 }) {
    if (!baseUrl) {
      throw new Error('jira base url required');
    }
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.authHeader = authHeader || '';
    this.timeoutMs = timeoutMs;
  }

  async createIssue(projectKey, issueType, summary, description, labels = []) {
    if (!projectKey) throw new Error('jira project key required');
    if (!issueType) throw new Error('jira issue type required');
    if (!summary) throw new Error('jira issue summary required');

    const payload = {
      fields: {
        project: { key: projectKey },
        summary,
        issuetype: { name: issueType },
        description: description || '',
      },
    };

    if (Array.isArray(labels) && labels.length) {
      payload.fields.labels = labels.filter(Boolean);
    }

    const endpoint = `${this.baseUrl}/rest/api/3/issue`;
    const responseBody = await this._request('POST', endpoint, payload);
    let parsed;
    try {
      parsed = JSON.parse(responseBody || '{}');
    } catch (err) {
      const error = new Error('jira create: invalid JSON response');
      error.cause = err;
      throw error;
    }
    if (!parsed || !parsed.key) {
      throw new Error('jira create: missing issue key');
    }
    return {
      key: parsed.key,
      self: parsed.self || `${this.baseUrl}/rest/api/3/issue/${parsed.key}`,
    };
  }

  _request(method, urlStr, body) {
    return new Promise((resolve, reject) => {
      let parsedUrl;
      try {
        parsedUrl = new URL(urlStr);
      } catch (err) {
        reject(err);
        return;
      }
      const isHttps = parsedUrl.protocol === 'https:';
      const transport = isHttps ? https : http;
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      };
      if (this.authHeader) {
        headers.Authorization = this.authHeader;
      }
      const options = {
        method,
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        headers,
      };
      const req = transport.request(options, (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data || '{}');
          } else {
            const message = (data || '').trim() || res.statusMessage || 'jira request failed';
            const err = new Error(`jira ${method} ${res.statusCode}: ${message}`);
            err.statusCode = res.statusCode;
            err.body = data;
            reject(err);
          }
        });
      });
      req.on('error', reject);
      if (this.timeoutMs) {
        req.setTimeout(this.timeoutMs, () => {
          req.destroy(new Error('jira request timeout'));
        });
      }
      if (body) {
        let payload;
        try {
          payload = typeof body === 'string' ? body : JSON.stringify(body);
        } catch (err) {
          req.destroy(err);
          return;
        }
        req.write(payload);
      }
      req.end();
    });
  }
}

function createJiraClientFromEnv() {
  const base = (process.env.JIRA_BASE_URL || '').trim();
  const user = (process.env.JIRA_USER_EMAIL || '').trim();
  const token = process.env.JIRA_API_TOKEN || '';
  if (!base || !user || !token) {
    throw new Error('jira env not set');
  }
  const auth = 'Basic ' + Buffer.from(`${user}:${token}`).toString('base64');
  return new JiraClient({ baseUrl: base, authHeader: auth });
}

module.exports = { JiraClient, createJiraClientFromEnv };
