const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  renewalKey: { type: String, required: true },
  daysBefore: Number,
  channel: { type: String, enum: ['WhatsApp', 'Email'], required: true },
  dueAt: { type: Date, required: true, index: true },
  status: { type: String, enum: ['Scheduled', 'Sending', 'Sent', 'Delivered', 'Read', 'Failed', 'Cancelled', 'Unknown'], default: 'Scheduled', index: true },
  attempts: { type: Number, default: 0 },
  attemptedAt: Date,
  sentAt: Date,
  providerId: { type: String, index: true },
  error: { type: String, default: '' },
}, { timestamps: true });
schema.index({ customerId: 1, renewalKey: 1, daysBefore: 1, channel: 1 }, { unique: true });
module.exports = mongoose.model('RenewalNotice', schema);
