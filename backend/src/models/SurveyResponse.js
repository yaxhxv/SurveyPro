const mongoose = require('mongoose');

const surveyResponseSchema = new mongoose.Schema({
  survey_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Survey',
    required: true
  },
  respondent_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Respondent',
    required: true
  },
  answers: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    required: true
  },
  completed_at: {
    type: Date,
    default: Date.now
  },
  ip_address: String,
  user_agent: String
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Add indexes for better query performance
surveyResponseSchema.index({ survey_id: 1, completed_at: -1 });
surveyResponseSchema.index({ respondent_id: 1, completed_at: -1 });

module.exports = mongoose.model('SurveyResponse', surveyResponseSchema); 