const test = require('node:test')
const assert = require('node:assert/strict')
process.env.PI_HOST = '127.0.0.1'
process.env.PI_PORT = '1'
process.env.PI_TARGET_URL = 'http://pi.local/'

const { buildStatusPayload } = require('../src/routes/pi')

test('pi status endpoint returns structured payload', async () => {
  const body = await buildStatusPayload()
  assert.equal(body.ok, true)
  assert.equal(body.host, '127.0.0.1')
  assert.equal(body.port, 1)
  assert.equal(body.url, 'http://pi.local/')
  assert.equal(body.command, 'ssh pi@127.0.0.1 -p 1')
  assert.ok(Object.prototype.hasOwnProperty.call(body, 'reachable'))
  assert.ok(Object.prototype.hasOwnProperty.call(body, 'ts'))
})

