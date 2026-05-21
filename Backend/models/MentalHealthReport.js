const mongoose = require('mongoose');

const ScoreSchema = new mongoose.Schema({
  score: {
    type: Number,
    required: true,
    default: 0
  },
  severity: {
    type: String,
    required: true,
    default: 'minimal'
  }
}, { _id: false });

const MentalHealthReportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vitals: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  lifestyle: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  dass21: {
    depression: { type: ScoreSchema, default: () => ({}) },
    anxiety: { type: ScoreSchema, default: () => ({}) },
    stress: { type: ScoreSchema, default: () => ({}) }
  },
  gad7: {
    type: ScoreSchema,
    default: () => ({})
  },
  phq9: {
    type: ScoreSchema,
    default: () => ({})
  },
  overallRisk: {
    type: String,
    enum: ['low', 'moderate', 'high', 'severe'],
    default: 'low'
  },
  summary: {
    type: String,
    default: ''
  },
  recommendations: [{
    title: String,
    description: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  }]
}, { timestamps: true });

MentalHealthReportSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.models.MentalHealthReport ||
  mongoose.model('MentalHealthReport', MentalHealthReportSchema);
