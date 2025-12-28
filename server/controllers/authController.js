const User = require('../models/User');
const Identity = require('../models/Identity');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Setup email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const registerUser = async (req, res) => {
  const { email, password, realName } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const verificationToken = crypto.randomBytes(20).toString('hex');

    const user = await User.create({
      email,
      password,
      verificationToken,
    });

    if (user) {
      // Create default "Real" identity
      // Create default "Real" identity
      await Identity.create({
        user: user._id,
        type: 'real',
        name: realName,
        handle: `@${realName.replace(/\s+/g, '').toLowerCase()}`,
      });

      // Create "Anonymous" identity
      await Identity.create({
        user: user._id,
        type: 'anonymous',
        name: 'Anonymous',
        handle: null,
      });

      // Send verification email
      const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verify your account - Safe Space',
        html: `<p>Please click this link to verify your account: <a href="${verificationUrl}">${verificationUrl}</a></p>`,
      };

      try {
        await transporter.sendMail(mailOptions);
        res.status(201).json({
            _id: user._id,
            email: user.email,
            message: 'Registration successful! Please check your email to verify.',
        });
      } catch (emailError) {
          console.error("Email send error:", emailError);
           // Still return success for user creation, but warn
          res.status(201).json({
            _id: user._id,
            email: user.email,
            message: 'Registration successful! But email failed to send. Contact support.',
        });
      }

    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const verifyEmail = async (req, res) => {
    const { token } = req.params;
    try {
        const user = await User.findOne({ verificationToken: token });
        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }
        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();
        res.status(200).json({ message: 'Email verified successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      if (!user.isVerified) {
          return res.status(401).json({ message: 'Please verify your email first.' });
      }

      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      // Store refresh token (simple implementation, ideally rotate)
      user.refreshToken.push(refreshToken);
      await user.save();

      res.cookie('jwt', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'None',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.json({
        _id: user._id,
        email: user.email,
        accessToken,
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const refreshToken = async (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.status(401).json({ message: 'Unauthorized' });

    const refreshToken = cookies.jwt;

    try {
        const user = await User.findOne({ refreshToken }).exec();
        if (!user) return res.status(403).json({ message: 'Forbidden' });

        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
            if (err || user._id.toString() !== decoded.id) return res.status(403).json({ message: 'Forbidden' });

            const accessToken = generateAccessToken(user._id);
            res.json({ accessToken });
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const logoutUser = async (req, res) => {
    // In a real app, remove refreshToken from DB
    // For now, clear cookie
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(204);

    const refreshToken = cookies.jwt;
    const user = await User.findOne({ refreshToken }).exec();

    if (user) {
        user.refreshToken = user.refreshToken.filter(rt => rt !== refreshToken);
        await user.save();
    }

    res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true });
    res.sendStatus(204);
}

module.exports = { registerUser, loginUser, verifyEmail, logoutUser, refreshToken };
