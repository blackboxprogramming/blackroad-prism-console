const request = require('supertest');
const { app } = require('../../srv/blackroad-api/server_full.js');

async function getAuthCookie(credentials = {}) {
  const {
    username = 'root',
    password = 'Codex2025',
  } = credentials;

  const login = await request(app)
    .post('/api/login')
    .send({ username, password });

  if (login.status !== 200 || !login.body || login.body.ok !== true) {
    const errorMessage =
      login.body && login.body.error
        ? login.body.error
        : `unexpected response status: ${login.status}`;
    throw new Error(`failed to login: ${errorMessage}`);
  }

  const cookie = login.headers['set-cookie'];
  if (!cookie || cookie.length === 0) {
    throw new Error('failed to login: missing session cookie');
  }


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
  if (login.status !== 200) {
    throw new Error(`Login failed with status ${login.status}`);
  }
  const cookie = login.headers['set-cookie'];
  if (!Array.isArray(cookie) || cookie.length === 0) {
    throw new Error('Login succeeded but no auth cookie was returned');
  }
  return cookie;
}

module.exports = { getAuthCookie };

