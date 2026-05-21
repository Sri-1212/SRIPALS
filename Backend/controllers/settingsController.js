const crypto = require('crypto');
const User = require('../models/User');
const sendEmail = require('../utils/emailService');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

exports.getAccountInfo = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      accountInfo: {
        email: user.email,
        createdAt: user.createdAt,
        lastPasswordChange: user.lastPasswordChange,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.requestEmailChange = async (req, res, next) => {
  try {
    const { newEmail } = req.body;

    if (!newEmail) {
      return res.status(400).json({ success: false, message: 'New email is required' });
    }

    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already in use' });
    }

    const user = await User.findById(req.user.id);
    const otp = user.generateOTP();
    user.pendingEmail = newEmail;
    await user.save({ validateBeforeSave: false });

    await sendEmail({
      to: newEmail,
      subject: 'MindSpace Email Change Verification',
      text: `Your OTP for changing your email is: ${otp}. This OTP is valid for 10 minutes.`
    });

    res.status(200).json({ success: true, message: 'Verification OTP sent to new email' });
  } catch (error) {
    next(error);
  }
};

exports.verifyEmailChange = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const user = await User.findById(req.user.id);

    if (!user || !user.pendingEmail) {
      return res.status(400).json({ success: false, message: 'No pending email change found' });
    }

    const isValidOtp = user.verificationToken === hashToken(otp || '') &&
      user.verificationExpire &&
      user.verificationExpire > Date.now();

    if (!isValidOtp) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    user.email = user.pendingEmail;
    user.pendingEmail = undefined;
    user.verificationToken = undefined;
    user.verificationExpire = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Email changed successfully' });
  } catch (error) {
    next(error);
  }
};

exports.resendEmailOTP = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user || !user.pendingEmail) {
      return res.status(400).json({ success: false, message: 'No pending email change found' });
    }

    const otp = user.generateOTP();
    await user.save({ validateBeforeSave: false });

    await sendEmail({
      to: user.pendingEmail,
      subject: 'MindSpace Email Change Verification',
      text: `Your new OTP for changing your email is: ${otp}. This OTP is valid for 10 minutes.`
    });

    res.status(200).json({ success: true, message: 'OTP resent successfully' });
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    if (!user || !(await user.matchPassword(currentPassword || ''))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

exports.deleteAccount = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    res.status(200).json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
};
