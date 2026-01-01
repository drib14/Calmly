
const mainLayout = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 0; color: #1f2937; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
    .header { background-color: #ffffff; padding: 40px 40px 20px 40px; text-align: center; }
    .header h1 { margin: 0; color: #111827; font-family: 'Georgia', serif; font-size: 28px; letter-spacing: -0.5px; font-weight: 700; }
    .header-accent { width: 40px; height: 4px; background: #4b5563; margin: 20px auto 0; border-radius: 2px; }
    .content { padding: 40px; line-height: 1.7; font-size: 16px; color: #4b5563; }
    .footer { background-color: #f9fafb; padding: 30px; text-align: center; font-size: 13px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
    .button { display: inline-block; padding: 14px 28px; background-color: #1f2937; color: white !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); transition: background-color 0.2s; }
    .button:hover { background-color: #111827; }
    .code { font-size: 36px; letter-spacing: 4px; font-weight: 800; color: #111827; background: #f3f4f6; padding: 16px 32px; border-radius: 12px; display: inline-block; margin: 24px 0; border: 1px solid #e5e7eb; }
    .highlight { color: #111827; font-weight: 600; }
    a { color: #4b5563; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Calmly</h1>
      <div class="header-accent"></div>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Calmly. A space for your thoughts.</p>
      <p style="margin-top: 8px;">If you didn't request this email, you can safely ignore it.</p>
    </div>
  </div>
</body>
</html>
`;

const welcomeEmail = (name) => mainLayout(`
  <h2 style="font-size: 24px; color: #111827; margin-bottom: 24px;">Welcome, ${name}.</h2>
  <p>We are honored to have you join our community. Calmly is designed to be a sanctuary for your thoughts, feelings, and creativity.</p>
  <p>Your account is fully active. You can now:</p>
  <ul style="padding-left: 20px; margin-bottom: 24px;">
    <li>Share your stories anonymously or with a pseudonym.</li>
    <li>Keep a private, secure journal.</li>
    <li>Connect with others in a safe environment.</li>
  </ul>
  <div style="text-align: center;">
    <a href="${process.env.CLIENT_URL || '#'}" class="button">Start Your Journey</a>
  </div>
`);

const passwordResetEmail = (code) => mainLayout(`
  <h2 style="font-size: 24px; color: #111827; margin-bottom: 24px;">Reset Your Password</h2>
  <p>We received a request to reset the password for your Calmly account. Use the secure code below to proceed.</p>
  <div style="text-align: center;">
    <div class="code">${code}</div>
  </div>
  <p>This code will expire in <span class="highlight">10 minutes</span>.</p>
  <p style="font-size: 14px; margin-top: 24px;">If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
`);

module.exports = { welcomeEmail, passwordResetEmail };
