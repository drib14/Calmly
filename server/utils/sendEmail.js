const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: `"Calmly" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html, // HTML is now pre-formatted by the caller using emailTemplates
    });
    return true;
  } catch (error) {
    console.error("Email Error:", error);
    return false;
  }
};

module.exports = sendEmail;
