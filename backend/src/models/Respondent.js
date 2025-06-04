const mongoose = require('mongoose');

const respondentSchema = new mongoose.Schema({
  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true // Allows null/undefined values to be unique
  },
  name: {
    type: String,
    trim: true
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Add indexes for better query performance
respondentSchema.index({ email: 1 });
respondentSchema.index({ created_at: -1 });

module.exports = mongoose.model('Respondent', respondentSchema); 