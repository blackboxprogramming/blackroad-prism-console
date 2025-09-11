const request = require('supertest');

/**
 * Log in to the application using test credentials and return the
 * authentication cookie so it can be reused in subsequent requests.
 *
 * @param {import('express').Express} app - Express app under test.
 * @returns {Promise<string[]>} cookie headers from the login response
 */
async function getAuthCookie(app) {
  const login = await request(app)
    .post('/api/login')
    .send({ username: 'root', password: 'Codex2025' });
  return login.headers['set-cookie'];
}

module.exports = { getAuthCookie };
