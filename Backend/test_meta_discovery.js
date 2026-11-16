const { test } = require('node:test');
const assert = require('node:assert/strict');
const { fetchMetaCollection, fetchMetaPage } = require('./ai/integrations/meta/metaDiscoveryClient');
const args = { edge: 'accounts', fields: 'id,name', accessToken: 'private-test-token', version: 'v20.0' };
test('direct Page lookup recovers linked Instagram using existing access', async () => {
  const page = await fetchMetaPage({ ...args, pageId: '123', fetchImpl: async (url, options) => {
    assert.equal(new URL(url).pathname, '/v20.0/123');
    assert.equal(new URL(url).searchParams.has('access_token'), false);
    assert.equal(options.headers.Authorization, 'Bearer private-test-token');
    return { ok: true, json: async () => ({ id: '123', name: 'Brand', instagram_business_account: { id: 'ig', username: 'brand' } }) };
  } });
  assert.equal(page.instagram_business_account.username, 'brand');
});

test('direct Page lookup rejects invalid IDs before contacting Meta', async () => {
  await assert.rejects(fetchMetaPage({ ...args, pageId: '../me', fetchImpl: () => assert.fail('unexpected request') }), /numeric/);
});

test('direct Page lookup does not expose provider details on denied access', async () => {
  await assert.rejects(fetchMetaPage({ ...args, pageId: '123', fetchImpl: async () => ({ ok: false, json: async () => ({ error: { message: 'secret provider detail' } }) }) }), error => !error.message.includes('secret') && /account access/.test(error.message));
});
function serviceWith(fetchCollection) {
  const module = { exports: {} };
  require('node:vm').runInNewContext(require('node:fs').readFileSync(require.resolve('./ai/integrations/meta/MetaOAuthService'), 'utf8'), {
    module, process: { env: {} }, URLSearchParams,
    require: id => id === './metaDiscoveryClient' ? { fetchMetaCollection: fetchCollection } : {},
  });
  return module.exports;
}

test('failed ads discovery preserves successful Pages and reports a warning', async () => {
  const service = serviceWith(async ({ edge, fields }) => {
    if (edge === 'adaccounts') {
      assert.ok(!fields.split(',').includes('business'), 'optional business field requires an extra permission');
      throw new Error('permission denied');
    }
    return [{ id: 'page', name: 'Page', instagram_business_account: { id: 'ig', username: 'brand' } }];
  });
  const result = await service.discoverAssets('real-token-format');
  assert.equal(result.pages[0].pageId, 'page');
  assert.equal(result.pages[0].instagramBusinessAccountId, 'ig');
  assert.equal(result.adAccounts.length, 0);
  assert.match(result.discoveryWarnings[0], /ad accounts/);
});

test('empty selection cannot claim a successful connection', async () => {
  await assert.rejects(serviceWith().confirmAssetSelection({ selectedAssets: {} }), error => error.code === 'META_ASSET_SELECTION_REQUIRED');
});

test('ad discovery does not request business_management just to list accounts', async () => {
  let adFields;
  const service = serviceWith(async ({ edge, fields }) => {
    if (edge === 'adaccounts') { adFields = fields; return [{ id: 'act_1', name: 'Ads', currency: 'INR', account_status: 1 }]; }
    return [];
  });
  const result = await service.discoverAssets('real-token-format');
  assert.ok(adFields);
  assert.ok(!adFields.split(',').includes('business'));
  assert.equal(result.adAccounts.length, 1);
  assert.equal(result.discoveryWarnings.length, 0);
});

test('discovery reports permission errors instead of empty accounts', async () => {
  await assert.rejects(fetchMetaCollection({ ...args, fetchImpl: async () => ({ ok: false, json: async () => ({ error: { code: 200, message: 'private provider detail' } }) }) }), error => {
    assert.equal(error.code, 'META_DISCOVERY_FAILED');
    assert.match(error.message, /code 200/);
    assert.ok(!error.message.includes('private'));
    return true;
  });
});

test('discovery follows cursors without sending credentials in URLs', async () => {
  let count = 0;
  const result = await fetchMetaCollection({ ...args, fetchImpl: async (url, options) => {
    const target = new URL(url);
    assert.equal(target.searchParams.has('access_token'), false);
    assert.equal(options.headers.Authorization, 'Bearer private-test-token');
    count++;
    if (count === 1) return { ok: true, json: async () => ({ data: [{ id: 'one' }], paging: { next: 'https://untrusted.example', cursors: { after: 'cursor-2' } } }) };
    assert.equal(target.hostname, 'graph.facebook.com');
    assert.equal(target.searchParams.get('after'), 'cursor-2');
    return { ok: true, json: async () => ({ data: [{ id: 'two' }] }) };
  } });
  assert.deepEqual(result, [{ id: 'one' }, { id: 'two' }]);
});

test('empty successful discovery is distinct from failure', async () => {
  assert.deepEqual(await fetchMetaCollection({ ...args, fetchImpl: async () => ({ ok: true, json: async () => ({ data: [] }) }) }), []);
});

test('invalid pagination fails explicitly rather than looping', async () => {
  await assert.rejects(fetchMetaCollection({ ...args, fetchImpl: async () => ({ ok: true, json: async () => ({ data: [], paging: { next: 'next' } }) }) }), /pagination/);
});
