// models/Template.js

const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: '',
    },

    estimatedDays: {
      type: Number,
      default: 30,
    },

    estimatedCost: {
      type: Number,
      default: 0,
    },

    defaultDeliverables: [
      {
        title: String,
        category: String,
        days: Number,
      },
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    branchId: {
      type: String,
      default: 'BR001',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  'Template',
  templateSchema
);