const request = require('supertest');
const { app } = require('../../srv/blackroad-api/server_full.js');

async function getAuthCookie() {
  const login = await request(app)
    .post('/api/login')
    .send({ username: 'root', password: 'Codex2025' });
  return login.headers['set-cookie'];
}

module.exports = { getAuthCookie };

