const AgentRun = require('../models/AgentRun');
const AICommandExecution = require('../models/AICommandExecution');
const { actionScope } = require('../services/dashboardActionPolicy');

function aiRecordScope(user) {
  return actionScope(user).kind === 'company' ? {} : { requestedBy: user?._id || user?.id };
}

function requireStaff(req, res, next) {
  if (req.client?._id || !(req.user?._id || req.user?.id) || !req.user?.role || String(req.user.role).toLowerCase() === 'client') {
    return res.status(403).json({ success: false, message: 'Staff access required.' });
  }
  next();
}

function requireRecord(model, parameter, field) {
  return async (req, res, next) => {
    try {
      const record = await model.findOne({ [field]: req.params[parameter], ...aiRecordScope(req.user) }).select('_id');
      if (!record) return res.status(404).json({ success: false, message: 'AI record not found.' });
      next();
    } catch (error) {
      if (error.name === 'CastError') return res.status(400).json({ success: false, message: 'Invalid AI record ID.' });
      next(error);
    }
  };
}

module.exports = {
  aiRecordScope, requireStaff,
  requireAgentRun: requireRecord(AgentRun, 'id', '_id'),
  requireCommand: requireRecord(AICommandExecution, 'executionId', 'executionId'),
};

