async function fetchMetaCollection({ edge, fields, accessToken, version, fetchImpl = fetch }) {
  const items = [];
  let cursor;
  const seen = new Set();
  for (let page = 0; page < 100; page++) {
    const url = new URL(`https://graph.facebook.com/${version}/me/${edge}`);
    url.searchParams.set('fields', fields);
    url.searchParams.set('limit', '100');
    if (cursor) url.searchParams.set('after', cursor);
    const response = await fetchImpl(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(15000),
    });
    const body = await response.json();
    if (!response.ok || body.error || !Array.isArray(body.data)) {
      const error = new Error(`Meta ${edge} discovery failed${body.error?.code ? ` (code ${body.error.code})` : ''}. Reconnect Meta and check account access and granted permissions.`);
      error.code = 'META_DISCOVERY_FAILED';
      throw error;
    }
    items.push(...body.data);
    if (!body.paging?.next) return items;
    const next = body.paging.cursors?.after;
    if (!next || seen.has(next)) throw new Error(`Meta ${edge} pagination could not be completed. Please reconnect.`);
    seen.add(next);
    cursor = next;
  }
  throw new Error(`Meta ${edge} discovery exceeded the page limit.`);
}
async function fetchMetaPage({ pageId, accessToken, version, fetchImpl = fetch }) {
  if (!/^\d+$/.test(String(pageId))) throw new Error('Enter a numeric Facebook Page ID.');
  const url = new URL(`https://graph.facebook.com/${version}/${pageId}`);
  url.searchParams.set('fields', 'id,name,category,access_token,instagram_business_account{id,username}');
  const response = await fetchImpl(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(15000),
  });
  const body = await response.json();
  if (!response.ok || body.error || !body.id || !body.name) {
    throw new Error('Meta could not load this Page. Check the Page ID and your account access.');
  }
  return body;
}
module.exports = { fetchMetaCollection, fetchMetaPage };
