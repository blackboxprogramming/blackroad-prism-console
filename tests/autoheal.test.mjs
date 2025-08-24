import assert from 'node:assert/strict'
import autoheal from '../backend/autoheal.js'
import { store } from '../backend/data.js'
import { requireAdmin } from '../backend/utils.js'

// test audit log entry on restart
const req = { params: { service: 'api' }, user: { username: 'root', role: 'owner' } }
const res = { json(obj){ this.body = obj } }
const before = store.auditLogs.length
await autoheal.restart(req, res)
assert.equal(res.body.service, 'api')
assert.equal(store.auditLogs.length, before + 1)

// security test: non-admin blocked
const rReq = { user: { role: 'user' } }
const rRes = { statusCode: 0, status(c){ this.statusCode = c; return this }, json(o){ this.body = o } }
requireAdmin(rReq, rRes, ()=>{})
assert.equal(rRes.statusCode, 403)
