const EDITABLE_FIELDS = new Set(['campaignName', 'objective', 'conversionType', 'budget', 'duration', 'targetLocations', 'promotedServices', 'promotedOffer', 'strategy', 'audiences', 'adVariants', 'creativeRequirements', 'creativePosterAsset', 'specialAdCategory', 'metaSettings', 'googleSettings']);
function campaignError(message, statusCode = 400) { return Object.assign(new Error(message), { statusCode }); }
function validateCreation(body) {
  if (!/^[a-f\d]{24}$/i.test(String(body.customerId || ''))) throw campaignError('Select a valid customer.');
  const amount = Number(body.dailyBudget);
  if (!Number.isFinite(amount) || amount <= 0) throw campaignError('Daily budget must be a positive number.');
  if (!['Meta', 'Google', 'Omnichannel'].includes(body.platform || 'Meta')) throw campaignError('Select Meta, Google, or Omnichannel.');
  const days = body.duration?.days ?? body.durationDays;
  if (days !== undefined && (!Number.isInteger(Number(days)) || Number(days) < 1 || Number(days) > 365)) throw campaignError('Campaign duration must be between 1 and 365 days.');
  return amount;
}
function editableUpdates(body) {
  const updates = {};
  for (const key of Object.keys(body || {})) {
    if (!EDITABLE_FIELDS.has(key)) throw campaignError(`Field '${key}' cannot be changed in the blueprint.`);
    updates[key] = body[key];
  }
  if (!Object.keys(updates).length) throw campaignError('No blueprint changes provided.');
  if (updates.budget && (!Number.isFinite(Number(updates.budget.amount)) || Number(updates.budget.amount) <= 0)) throw campaignError('Budget must be positive.');
  return updates;
}
function budgetAllocations(amount, audiences) {
  if (!Array.isArray(audiences) || !audiences.length) throw campaignError('Add at least one audience.');
  const total = Math.round(Number(amount) * 100);
  if (!Number.isSafeInteger(total) || total <= 0) throw campaignError('Budget must be positive.');
  const weights = audiences.map(a => a.dailyBudgetShare === undefined ? 1 : Number(a.dailyBudgetShare));
  if (weights.some(w => !Number.isFinite(w) || w <= 0)) throw campaignError('Audience budget allocations must be positive.');
  const sum = weights.reduce((a, b) => a + b, 0);
  const result = weights.map(w => Math.floor(total * w / sum));
  result[result.length - 1] += total - result.reduce((a, b) => a + b, 0);
  if (result.some(v => v < 10000)) throw campaignError('Each audience needs at least ₹100 per day. Increase the budget or reduce audience tiers.');
  return result;
}
module.exports = { validateCreation, editableUpdates, budgetAllocations, campaignError };
