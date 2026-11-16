const crypto = require('crypto');
const Customer = require('../../models/Customer');
const CreativeProject = require('../../models/CreativeProject');
const Draft = require('../../models/OpenAIStudioDraft');
const Provider = require('../providers/OpenAIStudioProvider');
const Storage = require('../../services/storage/AssetStorageService');
const { actionScope } = require('../../services/dashboardActionPolicy');

function customerFilter(user) {
  if (!user?._id || !user.role || String(user.role).toLowerCase() === 'client') throw Provider.failure('Staff access required.', 403);
  const scope = actionScope(user);
  if (scope.denied) throw Provider.failure('Your staff account needs an assigned branch.', 403);
  if (scope.kind === 'company') return {};
  if (scope.kind === 'branch') return { branchId: scope.branchId };
  return { $or: [{ assignedTo: user._id }, { assignedManager: user._id }, { 'monthlyDeliverablesScope.assignedManagerId': user._id }] };
}
async function customerForUser(customerId, user) {
  if (!/^[a-f\d]{24}$/i.test(String(customerId || ''))) throw Provider.failure('Select a valid customer.', 400);
  const customer = await Customer.findOne({ _id: customerId, ...customerFilter(user) }).lean();
  if (!customer) throw Provider.failure('Customer not found or outside your assigned scope.', 404);
  return customer;
}
function brandContext(customer) {
  return {
    name: customer.brandName || customer.name || customer.companyName,
    industry: customer.businessProfile?.industry || customer.industry || customer.businessType || '',
    services: customer.businessProfile?.services || [],
    description: customer.brandProfile?.description || '',
    tagline: customer.brandProfile?.tagline || '',
    colors: customer.brandProfile?.brandColors || [],
    visualStyle: customer.brandProfile?.visualStyle || '',
    tone: customer.brandProfile?.toneOfVoice || [],
    city: customer.city || '',
    website: customer.website || '',
  };
}
function validateText(value, label, max, optional = false) {
  if (optional && (value === undefined || value === '')) return '';
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw Provider.failure(`${label} must be between 1 and ${max.toLocaleString('en-IN')} characters.`, 400);
  return value.trim();
}
async function synthesize({ customerId, user, occasion, customPrompt, theme }) {
  const customer = await customerForUser(customerId, user);
  const topic = validateText(occasion || 'Brand services', 'Occasion or topic', 200);
  const instructions = validateText(customPrompt, 'Instructions', 8000, true);
  const brief = await Provider.generateBrief({ context: brandContext(customer), occasion: topic, instructions });
  const draftId = crypto.randomUUID();
  await Draft.create({ draftId, customerId, userId: user._id, occasion: topic, theme: ['gold_luxury', 'modern_glass', 'festive_divine', 'bold_commercial', 'clinical_teal'].includes(theme) ? theme : 'modern_glass', brief });
  return { ...brief, draftId, customerId: String(customerId), imageModel: Provider.config().imageModel };
}
async function resultFor(draft) {
  const project = await CreativeProject.findById(draft.projectId).populate('customerId', 'name companyName logoUrl').lean();
  if (!project) throw Provider.failure('Generated draft project is unavailable. Contact an administrator before regenerating.', 409);
  return { project, asset: { assetUrl: draft.storage.assetUrl, sourceProvider: 'OpenAI', providerModel: draft.imageMetadata.model, width: draft.imageMetadata.width, height: draft.imageMetadata.height, renderSettings: { heroImageUrl: draft.storage.assetUrl } }, provider: 'OpenAI', imageModel: draft.imageMetadata.model };
}
async function generate({ customerId, user, draftId, prompt, baseUrl }) {
  const customer = await customerForUser(customerId, user);
  const approvedPrompt = validateText(prompt, 'Image prompt', 30000);
  let draft = await Draft.findOne({ draftId, customerId, userId: user._id });
  if (!draft) throw Provider.failure('Generate a brief for this customer before creating the image.', 404);
  if (draft.status === 'COMPLETE') {
    if (draft.generationPrompt !== approvedPrompt) throw Provider.failure('This brief already has a generated image. Generate a new brief to create another image.', 409);
    return resultFor(draft);
  }
  if (draft.storage && draft.generationPrompt !== approvedPrompt) throw Provider.failure('A generated image is already saved for the previous prompt. Complete that draft or generate a new brief.', 409);
  draft = await Draft.findOneAndUpdate({ _id: draft._id, status: { $in: ['READY', 'FAILED'] } }, { $set: { status: 'GENERATING', generationPrompt: approvedPrompt, lastError: '' } }, { new: true });
  if (!draft) throw Provider.failure('Image generation is already in progress. Do not submit another request.', 409);
  try {
    if (!draft.storage) {
      const image = await Provider.generateImage({ prompt: approvedPrompt, userId: user._id });
      const stored = await Storage.upload({ customerId, occasion: draft.occasion, assetId: `openai_${draft.draftId}`, version: 1, buffer: image.buffer, format: 'png', mimeType: 'image/png' });
      if (!stored.success || !stored.assetUrl) throw Provider.failure('OpenAI generated the image, but asset storage did not return a saved URL.');
      const assetUrl = stored.assetUrl.startsWith('/') ? new URL(stored.assetUrl, baseUrl).toString() : stored.assetUrl;
      draft.storage = { ...stored, assetUrl };
      draft.imageMetadata = { provider: 'OpenAI', model: image.model, requestId: image.requestId, width: image.width, height: image.height, actualPrompt: image.prompt };
      await draft.save();
    }
    const context = brandContext(customer);
    const copy = draft.brief.communication;
    const imageUrl = draft.storage.assetUrl;
    const common = {
      bgImageUrl: imageUrl, headline: copy.headline, subheadline: copy.supportingLine, ctaText: copy.cta, offerText: copy.offerText,
      phone: customer.contactNumbers?.[0] || customer.phone || '', website: customer.website || '', locationName: customer.city || '',
      logoUrl: customer.logoUrl || customer.brandProfile?.logoUrl || customer.logo || '', showLogo: true,
      primaryColor: context.colors[0] || '#0F172A', accentColor: context.colors[1] || '#06B6D4',
    };
    const project = await CreativeProject.findOneAndUpdate({ generationDraftId: draft.draftId }, { $setOnInsert: {
      generationDraftId: draft.draftId, customerId, title: `${context.name} — ${draft.occasion}`, assetType: 'Poster',
      dimensions: { width: draft.imageMetadata.width, height: draft.imageMetadata.height, aspectRatio: '1:1' },
      ...common, brief: draft.brief.creativeConcept.description, aiPrompt: approvedPrompt,
      brandContext: { ...context, provider: 'OpenAI', textModel: draft.brief.textModel, imageModel: draft.imageMetadata.model, communication: copy },
      versions: [{ versionNumber: 1, fileUrl: imageUrl, ...common, layoutTheme: draft.theme, prompt: approvedPrompt, caption: copy.caption, notes: `OpenAI ${draft.imageMetadata.model} image; editable copy is added separately in the studio.`, createdBy: user._id, provider: 'OpenAI', imageModel: draft.imageMetadata.model }],
      currentVersion: 1, approvalStatus: 'Draft', createdBy: user._id,
    } }, { upsert: true, new: true, runValidators: true });
    draft.projectId = project._id; draft.status = 'COMPLETE'; draft.lastError = ''; await draft.save();
    return resultFor(draft);
  } catch (error) {
    draft.status = 'FAILED'; draft.lastError = error.statusCode ? error.message : 'Could not save the generated creative. Retry to recover any saved image.';
    await draft.save();
    throw error.statusCode ? error : Provider.failure(draft.lastError);
  }
}
module.exports = { synthesize, generate, customerFilter, customerForUser, brandContext };
