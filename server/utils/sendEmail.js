const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  const template = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0; color: #374151; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .header { background-color: #ffffff; padding: 30px; text-align: center; border-bottom: 1px solid #f3f4f6; }
        .header h1 { margin: 0; color: #4b5563; font-family: 'Georgia', serif; font-size: 24px; letter-spacing: 0.5px; }
        .content { padding: 40px 30px; line-height: 1.6; }
        .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4b5563; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
        .code { font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #111827; background: #f3f4f6; padding: 10px 20px; border-radius: 8px; display: inline-block; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Calmly</h1>
        </div>
        <div class="content">
          ${html}
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Calmly Platform. A calm space for you.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"Calmly" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: template,
    });
    return true;
  } catch (error) {
    console.error("Email Error:", error);
    return false;
  }
};

module.exports = sendEmail;
