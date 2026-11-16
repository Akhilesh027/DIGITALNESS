const { protect } = require('./authMiddleware');
const { actionScope } = require('../services/dashboardActionPolicy');
const Customer = require('../models/Customer');
const AdCampaign = require('../models/AdCampaign');
async function scopeAds(req, res, next) {
  try {
    const scope = actionScope(req.user);
    if (!['company', 'branch'].includes(scope.kind)) return res.status(403).json({ success: false, error: 'Ad campaign access requires an administrator or branch manager.' });
    req.adsFilter = {};
    if (scope.kind === 'branch') {
      const clients = await Customer.find({ branchId: scope.branchId }).select('_id').lean();
      req.adsFilter.customerId = { $in: clients.map(c => c._id) };
    }
    if (req.query.customerId) {
      if (scope.kind === 'branch' && !req.adsFilter.customerId.$in.some(id => String(id) === String(req.query.customerId))) return res.status(403).json({ success: false, error: 'Customer outside your branch.' });
      req.adsFilter.customerId = req.query.customerId;
    }
    if (req.method === 'POST' && ['/campaigns/synthesize', '/campaigns/create-manual'].includes(req.path)) {
      require('../services/adCampaignPolicy').validateCreation(req.body);
      const customer = await Customer.findOne({ _id: req.body.customerId, ...(scope.kind === 'branch' ? { branchId: scope.branchId } : {}) }).lean();
      if (!customer) return res.status(404).json({ success: false, error: 'Customer not found.' });
    }
    next();
  } catch (error) { res.status(error.statusCode || 500).json({ success: false, error: error.message }); }
}
async function scopeCampaign(req, res, next) {
  try {
    const id = req.params.id;
    const campaign = await AdCampaign.findOne({ ...req.adsFilter, $or: [{ campaignId: id }, ...(/^[a-f\d]{24}$/i.test(id) ? [{ _id: id }] : [])] }).lean();
    if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found.' });
    req.adCampaign = campaign;
    next();
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
}
module.exports = { protect, scopeAds, scopeCampaign };
