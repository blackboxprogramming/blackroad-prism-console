const React = require('react');
const renderer = require('react-test-renderer');
const { BillingCard } = require('../BillingCard');

test('renders billing information', () => {
  const component = renderer.create(
    React.createElement(BillingCard, {
      plan: 'Pro',
      amountDue: 42,
      nextBillingDate: '2025-09-01'
    })
  );
  const tree = component.toJSON();
  expect(tree).toBeDefined();
});
