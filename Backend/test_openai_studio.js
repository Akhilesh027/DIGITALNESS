const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const Provider = require('./ai/providers/OpenAIStudioProvider');
process.env.OPENAI_API_KEY = 'unit-test-key';
const brief = { finalPrompt: 'A modern technology services background with negative space.', creativeConcept: { name: 'Connected growth', description: 'A technology brand scene.' }, communication: { headline: 'Digital growth', supportingLine: 'Services for your business', cta: 'Learn more', offerText: '', caption: 'Explore services.' } };
function ok(data) { return { ok: true, headers: { get: () => 'request-test' }, json: async () => data }; }
test('OpenAI prompt synthesis uses Responses structured outputs with no storage or fallback', async () => {
    let sent;
    const result = await Provider.generateBrief({ context: { name: 'Brand' }, occasion: 'Brand services', instructions: 'Blue palette', fetchImpl: async (url, options) => { assert.equal(url, 'https://api.openai.com/v1/responses'); sent = JSON.parse(options.body); return ok({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(brief) }] }] }); } });
    assert.equal(sent.store, false); assert.equal(sent.text.format.type, 'json_schema'); assert.equal(sent.text.format.strict, true); assert.equal(result.finalPrompt, brief.finalPrompt); assert.equal(result.provider, 'OpenAI');
});
test('OpenAI refusals and malformed briefs never become success content', async () => {
    await assert.rejects(Provider.generateBrief({ fetchImpl: async () => ok({ output: [{ content: [{ type: 'refusal' }] }] }) }), /Revise/);
    await assert.rejects(Provider.generateBrief({ fetchImpl: async () => ok({ output: [{ content: [{ type: 'output_text', text: '{}' }] }] }) }), /incomplete/);
});
test('GPT Image keeps the reviewed prompt and returns actual PNG dimensions', async () => {
    const png = Buffer.alloc(24); Buffer.from('89504e470d0a1a0a', 'hex').copy(png); png.writeUInt32BE(1024, 16); png.writeUInt32BE(1024, 20); let sent;
    const prompt = 'A detailed reviewed scene. '.repeat(80);
    const result = await Provider.generateImage({ prompt, userId: 'user', fetchImpl: async (url, options) => { assert.equal(url, 'https://api.openai.com/v1/images/generations'); sent = JSON.parse(options.body); return ok({ data: [{ b64_json: png.toString('base64') }] }); } });
    assert.ok(sent.prompt.startsWith(prompt.trim())); assert.ok(sent.prompt.length > 1000); assert.equal(sent.n, 1); assert.equal(sent.size, '1024x1024'); assert.equal(sent.output_format, 'png'); assert.equal(sent.response_format, undefined); assert.equal(result.width, 1024); assert.equal(result.height, 1024); assert.ok(Buffer.isBuffer(result.buffer));
});
test('OpenAI quota errors are actionable and never expose raw provider details', async () => {
    for (const code of ['insufficient_quota', 'credit_balance_exhausted', 'billing_hard_limit_reached']) await assert.rejects(Provider.generateImage({ prompt: 'Scene', userId: 'user', fetchImpl: async () => ({ ok: false, status: 429, json: async () => ({ error: { code, message: 'secret provider details' } }) }) }), error => error.statusCode === 429 && /billing/.test(error.message) && !error.message.includes('secret'));
});
test('missing or corrupt image bytes fail instead of producing a preview URL', async () => {
    await assert.rejects(Provider.generateImage({ prompt: 'Scene', userId: 'user', fetchImpl: async () => ok({ data: [{ url: 'https://stock.example/fallback.png' }] }) }), /valid image/);
    await assert.rejects(Provider.generateImage({ prompt: 'Scene', userId: 'user', fetchImpl: async () => ok({ data: [{ b64_json: Buffer.from('fake').toString('base64') }] }) }), /invalid PNG/);
});
function serviceHarness() {
    const customer = { _id: 'a'.repeat(24), name: 'Brand', companyName: 'Brand LLC', city: 'Hyderabad', brandProfile: { brandColors: ['#112233'] } };
    const draft = { _id: 'draft-record', draftId: 'draft-1', customerId: customer._id, userId: 'user', brief, occasion: 'Brand services', theme: 'modern_glass', status: 'READY', save: async function () { return this; } };
    let imageCalls = 0, projectWrites = 0, project;
    const module = { exports: {} };
    vm.runInNewContext(fs.readFileSync(require.resolve('./ai/creative/OpenAIStudioService'), 'utf8'), {
        module, URL, Date, require: id => id === 'crypto' ? require('crypto') : id.endsWith('/Customer') ? { findOne: () => ({ lean: async () => customer }) } : id.endsWith('/CreativeProject') ? { findOneAndUpdate: async (filter, update) => { projectWrites++; project = { _id: 'project-1', ...update.$setOnInsert }; return project; }, findById: () => ({ populate: () => ({ lean: async () => project }) }) } : id.endsWith('/OpenAIStudioDraft') ? { findOne: async () => draft, findOneAndUpdate: async (filter, update) => { if (!filter.status.$in.includes(draft.status)) return null; Object.assign(draft, update.$set); return draft; } } : id.endsWith('/OpenAIStudioProvider') ? { failure: Provider.failure, generateImage: async ({ prompt }) => { imageCalls++; return { buffer: Buffer.from('image'), width: 1024, height: 1024, model: 'gpt-image-1.5', prompt }; } } : id.endsWith('/AssetStorageService') ? { upload: async () => ({ success: true, assetUrl: '/uploads/creatives/real.png' }) } : id.endsWith('/dashboardActionPolicy') ? require('./services/dashboardActionPolicy') : {},
    });
    return { service: module.exports, draft, customer, get imageCalls() { return imageCalls; }, get projectWrites() { return projectWrites; } };
}
test('generated images persist draft copy, customer data, provenance and a reachable URL', async () => {
    const h = serviceHarness(); const args = { customerId: h.customer._id, user: { _id: 'user', role: 'Admin' }, draftId: 'draft-1', prompt: brief.finalPrompt, baseUrl: 'https://server.digitalness.co.in' };
    const result = await h.service.generate(args); assert.equal(result.project.versions[0].fileUrl, 'https://server.digitalness.co.in/uploads/creatives/real.png'); assert.equal(result.project.headline, brief.communication.headline); assert.equal(result.project.offerText, ''); assert.equal(result.project.phone, ''); assert.equal(result.project.approvalStatus, 'Draft'); assert.equal(result.project.brandContext.provider, 'OpenAI'); assert.equal(h.draft.status, 'COMPLETE');
    await h.service.generate(args); assert.equal(h.imageCalls, 1); assert.equal(h.projectWrites, 1);
    await assert.rejects(h.service.generate({ ...args, prompt: 'Different scene' }), /already has/);
});
test('an in-progress image request cannot trigger a second paid generation', async () => {
    const h = serviceHarness(); h.draft.status = 'GENERATING';
    await assert.rejects(h.service.generate({ customerId: h.customer._id, user: { _id: 'user', role: 'Admin' }, draftId: 'draft-1', prompt: brief.finalPrompt }), /already in progress/); assert.equal(h.imageCalls, 0);
});
test('customer scopes deny clients and limit staff to assigned customers', () => {
    const h = serviceHarness(); assert.throws(() => h.service.customerFilter({ _id: 'client', role: 'Client' }), /Staff/);
    const scope = h.service.customerFilter({ _id: 'designer', role: 'Graphic Designer' }); assert.equal(scope.$or[0].assignedTo, 'designer');
    assert.equal(h.service.customerFilter({ _id: 'manager', role: 'Branch Manager', branchId: 'branch' }).branchId, 'branch');
    const context = h.service.brandContext({ ...h.customer, notes: 'private notes', activityLogs: [{ message: 'private' }] }); assert.equal(context.notes, undefined); assert.equal(context.activityLogs, undefined);
});
