const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  branchId: { type: String, default: '' },
  dayKey: { type: String, required: true },
  attendance: { type: mongoose.Schema.Types.ObjectId, ref: 'Attendance', default: null },
  expectedRevision: { type: Number, default: 0 },
  expectedUpdatedAt: { type: Date, default: null },
  proposedIn: { type: Date, required: true },
  proposedOut: { type: Date, required: true },
  breakMinutes: { type: Number, required: true, min: 0 },
  reason: { type: String, required: true, maxlength: 2000 },
  status: { type: String, enum: ['Pending', 'Processing', 'Approved', 'Rejected', 'Withdrawn'], default: 'Pending' },
  isPending: { type: Boolean, default: true },
  reviewNote: { type: String, default: '' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null },
  before: mongoose.Schema.Types.Mixed,
  after: mongoose.Schema.Types.Mixed,
}, { timestamps: true });
schema.index({ employee: 1, dayKey: 1 }, { unique: true, partialFilterExpression: { isPending: true } });
module.exports = mongoose.model('AttendanceCorrection', schema);
