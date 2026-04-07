const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

exports.sendVerificationEmail = async (user, token) => {
  const url = `${process.env.FRONTEND_URL}/verify-email/${token}`;
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Verify your email - TradeSphere',
      html: `<p>Please verify your email by clicking <a href="${url}">here</a>.</p>`
    });
  } catch (error) {
    console.error('Email sending failed:', error);
  }
};

exports.sendPasswordResetEmail = async (user, token) => {
  const url = `${process.env.FRONTEND_URL}/reset-password/${token}`;
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password Reset - TradeSphere',
      html: `<p>Reset your password by clicking <a href="${url}">here</a>.</p>`
    });
  } catch (error) {
    console.error('Email sending failed:', error);
  }
};

exports.sendOrderConfirmationEmail = async (user, order) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `Order Confirmation - ${order.symbol}`,
      html: `<p>Your order for ${order.quantity} shares of ${order.symbol} has been placed.</p>`
    });
  } catch (error) {
    console.error('Email sending failed:', error);
  }
};
