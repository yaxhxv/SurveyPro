const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['short-text', 'long-text', 'single-choice', 'multiple-choice', 'rating', 'nps']
  },
  question: {
    type: String,
    required: true
  },
  options: [{
    type: String
  }],
  required: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const surveySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'completed'],
    default: 'draft'
  },
  questions: [questionSchema],
  published_at: {
    type: Date
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Add indexes for better query performance
surveySchema.index({ user_id: 1, status: 1 });
surveySchema.index({ created_at: -1 });

module.exports = mongoose.model('Survey', surveySchema); 