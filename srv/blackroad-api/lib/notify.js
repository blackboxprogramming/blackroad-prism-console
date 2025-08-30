const logger = require('./log');

async function post(url, payload, headers = {}) {
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    logger.error({ event: 'notify_error', url, error: String(e) });
  }
}

async function slack(text) {
  if (!process.env.SLACK_WEBHOOK_URL) return;
  await post(process.env.SLACK_WEBHOOK_URL, { text });
}

async function airtable(fields) {
  if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) return;
  const url = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(process.env.AIRTABLE_TABLE_DEPLOYS || 'Deploys')}`;
  await post(url, { fields }, { Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}` });
}

async function linear(body) {
  if (!process.env.LINEAR_API_KEY) return;
  await post('https://api.linear.app/graphql', body, { 'Authorization': process.env.LINEAR_API_KEY });
}

async function salesforce(body) {
  if (!process.env.SF_USERNAME || !process.env.SF_PASSWORD) return;
  // Simplified: send login + create record in one request (stub)
  await post(process.env.SF_LOGIN_URL || 'https://login.salesforce.com', body);
}

module.exports = { slack, airtable, linear, salesforce };
