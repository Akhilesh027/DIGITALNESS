function metaDiscoveryRedirect(session, env = process.env) {
  const base = env.FRONTEND_URL || env.CLIENT_URL || 'http://localhost:8080';
  const target = new URL(`/customers/${encodeURIComponent(String(session.customerId))}/onboarding`, base);
  if (!['http:', 'https:'].includes(target.protocol)) throw new Error('Invalid frontend URL configuration.');
  target.searchParams.set('metaDiscoverySession', session.sessionId);
  return target.toString();
}

module.exports = { metaDiscoveryRedirect };
