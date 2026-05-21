const MentalHealthReport = require('../models/MentalHealthReport');
const ModuleProgress = require('../models/ModuleProgress');
const User = require('../models/User');
const sendEmail = require('../utils/emailService');

const riskRank = {
  low: 1,
  moderate: 2,
  high: 3,
  severe: 4
};

const normalizeSeverity = (severity) => String(severity || 'minimal').toLowerCase();

const riskFromSeverity = (severity) => {
  const normalized = normalizeSeverity(severity);

  if (['severe', 'extremely severe'].includes(normalized)) return 'severe';
  if (['high', 'moderately severe'].includes(normalized)) return 'high';
  if (['moderate', 'mild'].includes(normalized)) return 'moderate';
  return 'low';
};

const getOverallRisk = (scores) => {
  const risks = [
    riskFromSeverity(scores.dass21?.depression?.severity),
    riskFromSeverity(scores.dass21?.anxiety?.severity),
    riskFromSeverity(scores.dass21?.stress?.severity),
    riskFromSeverity(scores.gad7?.severity),
    riskFromSeverity(scores.phq9?.severity)
  ];

  return risks.sort((a, b) => riskRank[b] - riskRank[a])[0] || 'low';
};

const buildRecommendations = (overallRisk) => {
  const base = [
    {
      title: 'Keep tracking your mood',
      description: 'Continue logging mood and lifestyle patterns so changes are easier to spot.',
      priority: 'medium'
    },
    {
      title: 'Protect sleep and movement',
      description: 'Aim for a consistent sleep routine and light physical activity on most days.',
      priority: 'medium'
    }
  ];

  if (overallRisk === 'high' || overallRisk === 'severe') {
    return [
      {
        title: 'Speak with a mental health professional',
        description: 'Your assessment suggests elevated concern. Please consider booking support or contacting a trusted professional.',
        priority: 'high'
      },
      ...base
    ];
  }

  if (overallRisk === 'moderate') {
    return [
      {
        title: 'Schedule a check-in',
        description: 'Consider speaking with a counselor, mentor, or trusted person before symptoms increase.',
        priority: 'medium'
      },
      ...base
    ];
  }

  return base;
};

exports.analyzeMentalHealth = async (req, res, next) => {
  try {
    const { vitals = {}, lifestyle = {}, dass21, gad7, phq9 } = req.body;

    if (!dass21 || !gad7 || !phq9) {
      return res.status(400).json({
        success: false,
        message: 'DASS-21, GAD-7, and PHQ-9 scores are required'
      });
    }

    const scores = { dass21, gad7, phq9 };
    const overallRisk = getOverallRisk(scores);
    const report = await MentalHealthReport.create({
      user: req.user.id,
      vitals,
      lifestyle,
      dass21,
      gad7,
      phq9,
      overallRisk,
      summary: `Assessment completed with an overall ${overallRisk} risk level.`,
      recommendations: buildRecommendations(overallRisk)
    });

    res.status(201).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

exports.getMentalHealthReports = async (req, res, next) => {
  try {
    const reports = await MentalHealthReport.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: reports.length, data: reports });
  } catch (error) {
    next(error);
  }
};

exports.getMentalHealthReport = async (req, res, next) => {
  try {
    const report = await MentalHealthReport.findOne({ _id: req.params.id, user: req.user.id });

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

exports.emailMentalHealthReport = async (req, res, next) => {
  try {
    const report = await MentalHealthReport.findOne({ _id: req.body.reportId, user: req.user.id });
    const user = await User.findById(req.user.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    await sendEmail({
      to: user.email,
      subject: 'Your MindSpace Mental Health Report',
      text: [
        `Overall risk: ${report.overallRisk}`,
        `Depression: ${report.dass21.depression.score} (${report.dass21.depression.severity})`,
        `Anxiety: ${report.dass21.anxiety.score} (${report.dass21.anxiety.severity})`,
        `Stress: ${report.dass21.stress.score} (${report.dass21.stress.severity})`,
        `GAD-7: ${report.gad7.score} (${report.gad7.severity})`,
        `PHQ-9: ${report.phq9.score} (${report.phq9.severity})`
      ].join('\n')
    });

    res.status(200).json({ success: true, message: 'Report emailed successfully' });
  } catch (error) {
    next(error);
  }
};

exports.downloadReportPDF = async (req, res, next) => {
  try {
    const report = await MentalHealthReport.findOne({ _id: req.params.id, user: req.user.id });

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

exports.saveModuleProgress = async (req, res, next) => {
  try {
    const { module, data, progress } = req.body;
    const current = await ModuleProgress.findOne({ user: req.user.id });
    const nextProgress = { ...(current?.progress || {}) };

    if (progress && typeof progress === 'object') {
      Object.assign(nextProgress, progress);
    } else if (module) {
      nextProgress[module] = data || req.body[module] || {};
    } else {
      Object.assign(nextProgress, req.body);
    }

    const saved = await ModuleProgress.findOneAndUpdate(
      { user: req.user.id },
      { progress: nextProgress },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ success: true, progress: saved.progress });
  } catch (error) {
    next(error);
  }
};

exports.getModuleProgress = async (req, res, next) => {
  try {
    const saved = await ModuleProgress.findOne({ user: req.user.id });
    res.status(200).json({ success: true, progress: saved?.progress || {} });
  } catch (error) {
    next(error);
  }
};

exports.clearModuleProgress = async (req, res, next) => {
  try {
    await ModuleProgress.findOneAndDelete({ user: req.user.id });
    res.status(200).json({ success: true, message: 'Progress cleared successfully' });
  } catch (error) {
    next(error);
  }
};
