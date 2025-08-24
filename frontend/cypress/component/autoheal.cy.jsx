import React from 'react'
import AutoHeal from '../../src/pages/AutoHeal.jsx'

describe('Auto-Heal feed', () => {
  it('updates when events arrive', () => {
    const mockSocket = {
      handlers: {},
      on(event, cb) { this.handlers[event] = cb },
      emit(event, data) { this.handlers[event] && this.handlers[event](data) }
    }
    cy.mount(<AutoHeal socket={mockSocket} fetchEvents={() => Promise.resolve([])} />)
    const ev = { timestamp: new Date().toISOString(), service: 'API', action: 'restart', result: 'success' }
    cy.then(() => { mockSocket.emit('autoheal:event', ev) })
    cy.contains('API').should('exist')
  })
})
