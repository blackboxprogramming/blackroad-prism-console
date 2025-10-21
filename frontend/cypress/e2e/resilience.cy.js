describe('Resilience dashboard', () => {
  it('creates snapshot, triggers rollback and shows logs', () => {
    cy.intercept('GET', '/api/snapshots', { snapshots: [
      { id: '1', timestamp: '2024-01-01', size: '1MB', status: 'complete' }
    ]})
    cy.intercept('GET', '/api/snapshots/logs', { logs: [
      { timestamp: '2024-01-01', action: 'snapshot', user: 'alice', result: 'ok', notes: '' }
    ]})
    cy.intercept('GET', '/api/rollback/logs', { logs: [
      { timestamp: '2024-01-02', action: 'rollback', user: 'bob', result: 'success', notes: '' }
    ]})

    cy.visit('/index.html#/resilience')

    cy.contains('Snapshots')
    cy.intercept('POST', '/api/snapshots', {
      snapshot: { id: '2', timestamp: '2024-01-03', size: '2MB', status: 'complete' }
    }).as('createSnap')
    cy.get('button').contains('Create').click()
    cy.wait('@createSnap')

    cy.intercept('POST', '/api/rollback/*', { status: 'success' }).as('rollback')
    cy.get('select').select('2024-01-01')
    cy.on('window:confirm', () => true)
    cy.contains('Rollback').click()
    cy.wait('@rollback')

    cy.contains('Logs')
    cy.get('table').last().contains('rollback')
  })
})
