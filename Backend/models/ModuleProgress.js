const mongoose = require('mongoose');

const ModuleProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  progress: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

module.exports = mongoose.models.ModuleProgress ||
  mongoose.model('ModuleProgress', ModuleProgressSchema);
