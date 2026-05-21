const Appointment = require('../models/Appointment');

const specialists = [
  {
    id: 'dr-aisha-mehra',
    name: 'Dr. Aisha Mehra',
    specialty: 'Clinical Psychologist',
    image: 'images/team/1.png',
    rating: 4.9,
    reviews: 128,
    description: 'Specializes in anxiety, stress management, and student wellness.',
    price: 1200
  },
  {
    id: 'dr-rohan-iyer',
    name: 'Dr. Rohan Iyer',
    specialty: 'Counseling Therapist',
    image: 'images/team/2.png',
    rating: 4.8,
    reviews: 96,
    description: 'Helps students with relationships, academic pressure, and confidence.',
    price: 1000
  },
  {
    id: 'dr-neha-kapoor',
    name: 'Dr. Neha Kapoor',
    specialty: 'Mental Health Counselor',
    image: 'images/team/3.png',
    rating: 4.7,
    reviews: 84,
    description: 'Focuses on depression screening, coping skills, and lifestyle support.',
    price: 900
  }
];

exports.getSpecialists = async (req, res) => {
  res.status(200).json({ success: true, specialists });
};

exports.createAppointment = async (req, res, next) => {
  try {
    const { specialistId, patientName, patientEmail, date, time, sessionType, concern } = req.body;
    const specialist = specialists.find((item) => item.id === specialistId);

    if (!specialist) {
      return res.status(400).json({ success: false, message: 'Selected specialist was not found' });
    }

    const appointment = await Appointment.create({
      user: req.user.id,
      specialist,
      patientName,
      patientEmail,
      date,
      time,
      sessionType,
      concern
    });

    res.status(201).json({ success: true, appointment });
  } catch (error) {
    next(error);
  }
};

exports.getUserAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, appointments });
  } catch (error) {
    next(error);
  }
};

exports.getAppointmentById = async (req, res, next) => {
  try {
    const appointment = await Appointment.findOne({ _id: req.params.id, user: req.user.id });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    res.status(200).json({ success: true, appointment });
  } catch (error) {
    next(error);
  }
};

exports.cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { status: 'cancelled' },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    res.status(200).json({ success: true, appointment });
  } catch (error) {
    next(error);
  }
};
