import { test } from 'node:test'
import assert from 'node:assert'

function validate(data){
  const plans = ['free','builder','guardian']
  const cycles = ['monthly','annual']
  if(!plans.includes(data.plan)) throw new Error('plan')
  if(!cycles.includes(data.cycle)) throw new Error('cycle')
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) throw new Error('email')
  return true
}

test('accepts valid data', () => {
  assert.doesNotThrow(() => validate({ plan:'free', cycle:'monthly', email:'a@b.com' }))
})

test('rejects bad plan', () => {
  assert.throws(() => validate({ plan:'bad', cycle:'monthly', email:'a@b.com' }))
})

test('rejects bad email', () => {
  assert.throws(() => validate({ plan:'free', cycle:'monthly', email:'notanemail' }))
})
