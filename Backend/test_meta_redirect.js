const { test } = require('node:test');
const assert = require('node:assert/strict');
const { metaDiscoveryRedirect } = require('./utils/metaRedirect');

test('Meta callback returns to frontend onboarding with discovery session', () => {
  const url = new URL(metaDiscoveryRedirect({ customerId: 'customer-1', sessionId: 'session+1&x' }, {}));
  assert.equal(url.origin, 'http://localhost:8080');
  assert.equal(url.pathname, '/customers/customer-1/onboarding');
  assert.equal(url.searchParams.get('metaDiscoverySession'), 'session+1&x');
});

test('Meta callback respects configured frontend host', () => {
  for (const env of [{ CLIENT_URL: 'https://crm.example.com/' }, { FRONTEND_URL: 'https://crm.example.com', CLIENT_URL: 'http://localhost:8080' }]) {
    const url = new URL(metaDiscoveryRedirect({ customerId: 'customer-2', sessionId: 'session-2' }, env));
    assert.equal(url.origin, 'https://crm.example.com');
    assert.equal(url.pathname, '/customers/customer-2/onboarding');
  }
});
