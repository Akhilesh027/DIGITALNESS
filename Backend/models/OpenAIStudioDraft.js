const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  draftId: { type: String, required: true, unique: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  occasion: String,
  theme: String,
  brief: { type: mongoose.Schema.Types.Mixed, required: true },
  status: { type: String, enum: ['READY', 'GENERATING', 'FAILED', 'COMPLETE'], default: 'READY' },
  generationPrompt: String,
  storage: mongoose.Schema.Types.Mixed,
  imageMetadata: mongoose.Schema.Types.Mixed,
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'CreativeProject' },
  lastError: String,
}, { timestamps: true });
module.exports = mongoose.models.OpenAIStudioDraft || mongoose.model('OpenAIStudioDraft', schema);
