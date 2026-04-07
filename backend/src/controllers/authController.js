const User = require('../models/User');
const Wallet = require('../models/Wallet');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    user = await User.create({ name, email, password });
    
    // Create wallet
    await Wallet.create({ userId: user._id });

    // Try sending email (skip real token for MVP speed, assume auto verified or manual)
    const token = crypto.randomBytes(20).toString('hex');
    await sendVerificationEmail(user, token);

    res.status(201).json({ message: 'Registered successfully', userId: user._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.twoFactorEnabled) {
      const tempToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '10m' });
      return res.json({ requiresTwoFactor: true, tempToken });
    }

    res.json({
      user: { id: user._id, name: user.name, email: user.email },
      accessToken: user.generateJWT(),
      refreshToken: user.generateRefreshToken()
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.verifyTwoFactor = async (req, res) => {
  try {
    const { token, tempToken } = req.body;
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET || 'secret');
    const user = await User.findById(decoded.id);

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token
    });

    if (!verified) return res.status(400).json({ message: 'Invalid 2FA token' });

    res.json({
      user: { id: user._id, name: user.name, email: user.email },
      accessToken: user.generateJWT(),
      refreshToken: user.generateRefreshToken()
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.enableTwoFactor = async (req, res) => {
  try {
    const secret = speakeasy.generateSecret({ name: 'TradeSphere' });
    req.user.twoFactorSecret = secret.base32;
    await req.user.save();
    
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
    res.json({ qrCodeUrl, secret: secret.base32 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.disableTwoFactor = async (req, res) => {
  try {
    req.user.twoFactorEnabled = false;
    req.user.twoFactorSecret = undefined;
    await req.user.save();
    res.json({ message: '2FA disabled' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendPasswordResetEmail(user, resetToken);
    res.json({ message: 'Password reset link sent' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: 'Token invalid or expired' });

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMe = async (req, res) => {
  res.json({ user: req.user });
};

exports.verifyEmail = async (req, res) => {
  res.json({ message: 'Email verified route stub (skipping real verification for MVP demo)' });
};

exports.logout = async (req, res) => {
  res.json({ message: 'Logged out successfully' });
};

exports.refreshToken = async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(401).json({ message: 'No refresh token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'refresh');
    const user = await User.findById(decoded.id);
    res.json({ accessToken: user.generateJWT() });
  } catch (err) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};
