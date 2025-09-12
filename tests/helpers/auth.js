const request = require('supertest');

/**
 * Log in to the application and return the authentication cookie header.
 * Used by tests that need an authenticated session.
 *
 * @param {import('express').Express} app - Express app instance under test.
 * @returns {Promise<string[]>} set-cookie header for the authenticated user.
 */
async function getAuthCookie(app) {
  const login = await request(app)
    .post('/api/login')
    .send({ username: 'root', password: 'Codex2025' });
  return login.headers['set-cookie'];
}

module.exports = { getAuthCookie };
