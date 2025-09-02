import assert from 'assert'
import fs from 'fs'
process.env.AUTOHEAL_LOG = './tmp_autoheal.log'
const svc = await import('../src/services/autohealService.js')
const sample = { timestamp: '2024-01-01T00:00:00Z', service: 'API', action: 'restart', result: 'success' }
fs.writeFileSync(process.env.AUTOHEAL_LOG, JSON.stringify(sample)+'\n')
const events = svc.getEvents()
assert.strictEqual(events.length, 1)
assert.strictEqual(events[0].service, 'API')
fs.unlinkSync(process.env.AUTOHEAL_LOG)
console.log('ok')
