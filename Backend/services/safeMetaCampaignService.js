const AdCampaign = require('../models/AdCampaign');
const MarketingConnection = require('../models/MarketingConnection');
const { decryptToken } = require('../utils/cryptoUtil');
const targeting = require('../ai/integrations/connectors/meta/MetaTargetingNormalizer');
const { budgetAllocations, campaignError } = require('./adCampaignPolicy');
const config = require('../config/meta');

async function graph(token, path, payload) {
  const response = await fetch(`https://graph.facebook.com/${config.marketingApiVersion}/${path}`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload), signal: AbortSignal.timeout(20000),
  });
  const data = await response.json();
  if (!response.ok || data.error) throw campaignError(`Meta rejected the request${data.error?.code ? ` (code ${data.error.code})` : ''}: ${String(data.error?.message || 'Request failed').split(token).join('[redacted]')}`, 502);
  return data;
}
async function findCampaign(id) {
  const campaign = id && typeof id.save === 'function' ? id : await AdCampaign.findOne({ $or: [{ campaignId: String(id) }, ...(/^[a-f\d]{24}$/i.test(String(id)) ? [{ _id: id }] : [])] });
  if (!campaign) throw campaignError('Campaign not found.', 404);
  return campaign;
}
async function credentials(campaign) {
  if (campaign.platform !== 'Meta') throw campaignError('This action supports Meta campaigns. Google and Omnichannel blueprints can be drafted, but require their platform execution workflow.', 409);
  const location = campaign.clientLocationId || null;
  if (!campaign.metaSettings?.adAccountId) throw campaignError('Select a connected customer ad account in platform settings.', 409);
  const filter = { customerId: campaign.customerId?._id || campaign.customerId, platform: 'MetaAds', accountType: 'MetaAdAccount', status: { $in: ['CONNECTED', 'Connected'] }, ...(location ? { locationId: { $in: [location, null] } } : { locationId: null }) };
  if (campaign.metaSettings?.adAccountId) filter.platformAccountId = { $in: [campaign.metaSettings.adAccountId, campaign.metaSettings.adAccountId.replace(/^act_/, '') , `act_${campaign.metaSettings.adAccountId.replace(/^act_/, '')}`] };
  const connection = await MarketingConnection.findOne(filter).select('+accessToken');
  if (!connection) throw campaignError('Connect a Meta ad account for this customer before creating ads.', 409);
  if (connection.reauthRequired || (connection.tokenExpiresAt && new Date(connection.tokenExpiresAt) <= new Date())) throw campaignError('Meta connection expired. Reconnect the account.', 409);
  if (!connection.scopes?.includes('ads_management')) throw campaignError('The connected account needs ads_management permission.', 409);
  if (connection.metadata?.currency && connection.metadata.currency !== campaign.budget?.currency) throw campaignError('Campaign currency must match the connected ad account currency.');
  const token = decryptToken(connection.accessToken);
  if (!token || /mock|test_token|placeholder/i.test(token)) throw campaignError('A real Meta connection is required. Test credentials cannot create live platform objects.', 409);
  return { token, accountId: `act_${connection.platformAccountId.replace(/^act_/, '')}` };
}
async function lock(campaign) {
  const result = await AdCampaign.updateOne({ _id: campaign._id, dispatchLockAt: null, ...(campaign.updatedAt ? { updatedAt: campaign.updatedAt } : {}), ...(campaign.version !== undefined ? { version: campaign.version } : {}), status: campaign.status }, { $set: { dispatchLockAt: new Date() } });
  if (!result.modifiedCount) throw campaignError('Another platform operation is in progress. Refresh before retrying.', 409);
}
async function release(campaign) { await AdCampaign.updateOne({ _id: campaign._id }, { $set: { dispatchLockAt: null } }); }

class SafeMetaCampaignService {
  async dispatchCampaign(id, options = {}) {
    const campaign = await findCampaign(id);
    if (options.expectedUpdatedAt && new Date(campaign.updatedAt).toISOString() !== options.expectedUpdatedAt) throw campaignError('Campaign changed. Refresh before publishing.', 409);
    if (options.forceSimulation) throw campaignError('Simulation cannot be reported as a platform deployment.');
    if (!(options.validateOnly && ['Draft', 'Pending Approval'].includes(campaign.status)) && !['Approved', 'Paused'].includes(campaign.status)) throw campaignError('Approve the current blueprint before creating it on Meta.', 409);
    const { token, accountId } = await credentials(campaign);
    const pageId = campaign.metaSettings?.pageId;
    if (!/^\d+$/.test(pageId || '')) throw campaignError('Select a connected Facebook Page.');
    const page = await MarketingConnection.findOne({ customerId: campaign.customerId?._id || campaign.customerId, platform: 'Facebook', accountType: 'FacebookPage', platformAccountId: pageId, status: { $in: ['CONNECTED', 'Connected'] }, ...(campaign.clientLocationId ? { locationId: { $in: [campaign.clientLocationId, null] } } : { locationId: null }) });
    if (!page) throw campaignError('Connect this Facebook Page to the same customer before creating ads.', 409);
    const objective = { LEAD_GENERATION: 'OUTCOME_LEADS', OUTCOME_LEADS: 'OUTCOME_LEADS', TRAFFIC: 'OUTCOME_TRAFFIC', WEBSITE_TRAFFIC: 'OUTCOME_TRAFFIC', OUTCOME_TRAFFIC: 'OUTCOME_TRAFFIC' }[campaign.objective];
    if (!objective) throw campaignError('Meta creation currently supports lead generation and website traffic. Change the objective before approving.');
    const variant = campaign.adVariants?.[0];
    if (!variant?.headline || !variant?.primaryText) throw campaignError('Add a headline and primary ad text.');
    if (campaign.creativePosterAsset?.mediaType && campaign.creativePosterAsset.mediaType !== 'IMAGE') throw campaignError('Meta creation currently supports a single image creative.');
    const image = campaign.creativePosterAsset?.imageUrl;
    const destination = campaign.metaSettings?.destinationUrl;
    for (const [name, value] of [['creative image', image], ['destination', destination]]) {
      try { if (!['https:', 'http:'].includes(new URL(value).protocol)) throw new Error(); }
      catch { throw campaignError(`Add a valid ${name} URL.`); }
    }
    const formId = campaign.metaSettings?.leadGenFormId;
    if (objective === 'OUTCOME_LEADS' && !/^\d+$/.test(formId || '')) throw campaignError('Select a valid Meta lead form ID for lead generation.');
    const audiences = campaign.audiences?.length ? campaign.audiences : [{ name: 'Primary audience', dailyBudgetShare: 100, locations: campaign.targetLocations }];
    const budgets = budgetAllocations(campaign.budget.amount, audiences);
    const end = campaign.duration?.endDate || new Date(Date.now() + Number(campaign.duration?.days || 14) * 86400000);
    if (!Number.isFinite(new Date(end).getTime()) || new Date(end) <= new Date()) throw campaignError('Choose a future campaign end date.');
    const targets = audiences.map(a => {
      const locations = a.locations?.length ? a.locations : campaign.targetLocations;
      if (!locations?.length) throw campaignError('Specify a target location.');
      const result = targeting.normalizeTargeting({ locations, ageRange: a.ageRange, genders: a.genders });
      if (!result.geo_locations.cities && !locations.every(l => /^(IN|India)$/i.test(l))) throw campaignError('Target city could not be resolved. Use a supported city or explicitly select India.');
      return result;
    });
    if (options.validateOnly) return { success: true, message: 'Local account, budget, targeting and creative checks passed. Meta validates delivery eligibility when objects are created.', accountId, audienceCount: audiences.length, dailyBudgetsMinorUnits: budgets };
    if (campaign.syncStatus === 'UNKNOWN') throw campaignError('The previous Meta request had an uncertain outcome. Reconcile created objects in Meta Ads Manager before retrying to avoid duplicates.', 409);
    if (campaign.metaAdIds?.length === audiences.length && campaign.metaCampaignId && campaign.metaCreativeId && campaign.metaAdSetIds?.length === audiences.length) {
      if (campaign.syncStatus !== 'SYNCED') {
        await lock(campaign);
        try {
          campaign.status = 'Paused'; campaign.platformStatus = 'PAUSED'; campaign.externalStatus = 'PAUSED'; campaign.syncStatus = 'SYNCED'; campaign.dispatchError = '';
          await campaign.save();
        } finally { await release(campaign); }
      }
      return { success: true, campaign, status: campaign.status, platformCampaignId: campaign.metaCampaignId, dispatchMode: 'META_PAUSED', alreadyCreated: true };
    }
    await lock(campaign);
    try {
      campaign.duration.endDate = new Date(end);
      await campaign.save();
      if (!campaign.metaCampaignId) {
        const result = await graph(token, `${accountId}/campaigns`, { name: campaign.campaignName, objective, status: 'PAUSED', buying_type: 'AUCTION', special_ad_categories: campaign.specialAdCategory && campaign.specialAdCategory !== 'NONE' ? [campaign.specialAdCategory] : [] });
        if (!/^\d+$/.test(result.id || '')) throw campaignError('Meta did not return a campaign ID.', 502);
        campaign.metaCampaignId = result.id; campaign.platformCampaignId = result.id;
        await campaign.save();
      }
      if (!campaign.metaCreativeId) {
        const value = objective === 'OUTCOME_LEADS' ? { lead_gen_form_id: formId } : { link: destination };
        const result = await graph(token, `${accountId}/adcreatives`, { name: `${campaign.campaignName} — Creative`, object_story_spec: { page_id: pageId, ...(campaign.metaSettings.instagramActorId && /^\d+$/.test(campaign.metaSettings.instagramActorId) ? { instagram_actor_id: campaign.metaSettings.instagramActorId } : {}), link_data: { link: destination, picture: image, message: variant.primaryText, name: variant.headline, call_to_action: { type: objective === 'OUTCOME_LEADS' ? 'SIGN_UP' : 'LEARN_MORE', value } } } });
        if (!/^\d+$/.test(result.id || '')) throw campaignError('Meta did not return a creative ID.', 502);
        campaign.metaCreativeId = result.id; await campaign.save();
      }
      for (let i = 0; i < audiences.length; i++) {
        if (!campaign.metaAdSetIds[i]) {
          const result = await graph(token, `${accountId}/adsets`, { name: `${campaign.campaignName} — ${audiences[i].name}`, campaign_id: campaign.metaCampaignId, daily_budget: String(budgets[i]), billing_event: 'IMPRESSIONS', optimization_goal: objective === 'OUTCOME_LEADS' ? 'LEAD_GENERATION' : 'LINK_CLICKS', bid_strategy: 'LOWEST_COST_WITHOUT_BID_CAP', targeting: targets[i], ...(objective === 'OUTCOME_LEADS' ? { promoted_object: { page_id: pageId } } : {}), end_time: new Date(end).toISOString(), status: 'PAUSED' });
          if (!/^\d+$/.test(result.id || '')) throw campaignError('Meta did not return an ad set ID.', 502);
          campaign.metaAdSetIds[i] = result.id; await campaign.save();
        }
        if (!campaign.metaAdIds[i]) {
          const result = await graph(token, `${accountId}/ads`, { name: `${campaign.campaignName} — Ad ${i + 1}`, adset_id: campaign.metaAdSetIds[i], creative: { creative_id: campaign.metaCreativeId }, status: 'PAUSED' });
          if (!/^\d+$/.test(result.id || '')) throw campaignError('Meta did not return an ad ID.', 502);
          campaign.metaAdIds[i] = result.id; await campaign.save();
        }
      }
      campaign.status = 'Paused'; campaign.platformStatus = 'PAUSED'; campaign.externalStatus = 'PAUSED'; campaign.syncStatus = 'SYNCED'; campaign.dispatchError = '';
      await campaign.save();
      return { success: true, campaign, status: 'Paused', platformCampaignId: campaign.metaCampaignId, dispatchMode: 'META_PAUSED' };
    } catch (error) {
      campaign.dispatchError = error.message; campaign.syncStatus = ['TimeoutError', 'AbortError', 'TypeError', 'SyntaxError'].includes(error.name) || /did not return/.test(error.message) ? 'UNKNOWN' : 'FAILED'; await campaign.save(); throw error;
    } finally { await release(campaign); }
  }
  async toggleCampaign(id, options = {}) {
    const campaign = await findCampaign(id);
    const { token } = await credentials(campaign);
    if (!/^\d+$/.test(campaign.metaCampaignId || '') || !campaign.metaAdSetIds?.length || !campaign.metaAdIds?.length) throw campaignError('Create the approved campaign on Meta before changing delivery.', 409);
    const activate = !['Active', 'Live'].includes(campaign.status);
    if (activate && campaign.platformStatus === 'UNKNOWN') throw campaignError('Platform delivery status is unknown after a failed request. Verify and pause the campaign in Meta Ads Manager before retrying.', 409);
    if (activate && options.confirmActivation !== true) throw campaignError('Confirm the budget and activation before starting delivery.', 409);
    if (activate && campaign.syncStatus !== 'SYNCED') throw campaignError('Complete Meta creation before activation.', 409);
    if (activate && campaign.duration?.endDate && new Date(campaign.duration.endDate) <= new Date()) throw campaignError('This campaign has ended. Create a new draft before starting delivery.', 409);
    const status = activate ? 'ACTIVE' : 'PAUSED';
    await lock(campaign);
    try {
      if (!activate) await graph(token, campaign.metaCampaignId, { status });
      for (const objectId of [...campaign.metaAdIds, ...campaign.metaAdSetIds]) await graph(token, objectId, { status });
      if (activate) await graph(token, campaign.metaCampaignId, { status });
      campaign.status = activate ? 'Active' : 'Paused'; campaign.externalStatus = status; campaign.platformStatus = status;
      if (activate) campaign.launchedAt = new Date();
      campaign.dispatchError = ''; await campaign.save();
      return { success: true, status: campaign.status, campaign };
    } catch (error) {
      if (activate) {
        try { await graph(token, campaign.metaCampaignId, { status: 'PAUSED' }); campaign.status = 'Paused'; campaign.externalStatus = 'PAUSED'; campaign.platformStatus = 'PAUSED'; } catch { campaign.platformStatus = 'UNKNOWN'; }
      } else campaign.platformStatus = 'UNKNOWN';
      campaign.dispatchError = error.message; await campaign.save(); throw error;
    } finally { await release(campaign); }
  }
}
module.exports = new SafeMetaCampaignService();
