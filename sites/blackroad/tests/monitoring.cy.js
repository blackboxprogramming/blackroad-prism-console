describe('Monitoring dashboard', () => {
  beforeEach(() => {
    cy.intercept('GET', '/health/summary', {
      body: {
        'Frontend SPA': 'ok',
        API: 'ok',
        'Lucidia LLM': 'fail',
        'Infinity Math': 'degraded',
      },
    });
    cy.intercept('GET', '/contradictions', {
      body: [
        { module: 'core', description: 'example contradiction', timestamp: '1' },
      ],
    });
  });

  it('renders health matrix correctly', () => {
    cy.visit('/monitoring');
    cy.contains('Health Matrix');
    cy.get('table tbody td').should('have.length', 4);
  });

  it('shows new contradictions', () => {
    cy.visit('/monitoring');
    cy.contains('⚠️');
  });

  it('handles backend failure gracefully', () => {
    cy.intercept('GET', '/health/summary', { statusCode: 500 });
    cy.visit('/monitoring');
    cy.contains('Failed to load');
  });
});
