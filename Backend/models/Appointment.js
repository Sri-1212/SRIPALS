const mongoose = require('mongoose');

const SpecialistSchema = new mongoose.Schema({
  id: String,
  name: String,
  specialty: String,
  image: String,
  rating: Number,
  reviews: Number,
  description: String,
  price: Number
}, { _id: false });

const AppointmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  appointmentNumber: {
    type: String,
    unique: true
  },
  specialist: {
    type: SpecialistSchema,
    required: true
  },
  patientName: {
    type: String,
    required: true
  },
  patientEmail: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  sessionType: {
    type: String,
    enum: ['Video', 'Phone', 'In-person'],
    default: 'Video'
  },
  concern: {
    type: String,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['booked', 'cancelled', 'completed'],
    default: 'booked'
  }
}, { timestamps: true });

AppointmentSchema.pre('save', function(next) {
  if (!this.appointmentNumber) {
    const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
    this.appointmentNumber = `MS-${Date.now().toString().slice(-6)}-${suffix}`;
  }

  next();
});

AppointmentSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema);
