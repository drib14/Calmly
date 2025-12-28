const User = require('../models/User');
const Identity = require('../models/Identity');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

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

      const emailSent = await sendEmail({
        to: email,
        subject: 'Welcome to Calmly - Verify Your Account',
        html: `
          <h2>Welcome to your safe space.</h2>
          <p>We are honored to have you here. Please verify your email to start your journey.</p>
          <a href="${verificationUrl}" class="button" style="color: white;">Verify Account</a>
          <p style="margin-top: 20px; font-size: 12px; color: #888;">Or click here: <a href="${verificationUrl}">${verificationUrl}</a></p>
        `
      });

      if (emailSent) {
        res.status(201).json({
            _id: user._id,
            email: user.email,
            message: 'Registration successful! Please check your email.',
        });
      } else {
        res.status(201).json({
            _id: user._id,
            email: user.email,
            message: 'Registration successful! But email failed to send.',
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

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate 6-digit OTP
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetTokenHash = crypto.createHash('sha256').update(resetCode).digest('hex');

    // Save hashed token to DB
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save({ validateBeforeSave: false });

    // Send email
    const emailSent = await sendEmail({
      to: user.email,
      subject: 'Reset Password Code',
      html: `
        <p>You requested to reset your password. Use the code below to proceed.</p>
        <div class="code">${resetCode}</div>
        <p>This code expires in 10 minutes. If you didn't request this, please ignore this email.</p>
      `
    });

    if (emailSent) {
      res.status(200).json({ success: true, message: 'Reset code sent to email' });
    } else {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ message: 'Email could not be sent' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const verifyCode = async (req, res) => {
  const { email, code } = req.body;
  const resetTokenHash = crypto.createHash('sha256').update(code).digest('hex');

  try {
    const user = await User.findOne({
      email,
      resetPasswordToken: resetTokenHash,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    res.status(200).json({ success: true, message: 'Code verified' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const resetPassword = async (req, res) => {
  const { email, code, password } = req.body;
  const resetTokenHash = crypto.createHash('sha256').update(code).digest('hex');

  try {
    const user = await User.findOne({
      email,
      resetPasswordToken: resetTokenHash,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Password reset success',
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

module.exports = { registerUser, loginUser, verifyEmail, logoutUser, refreshToken, forgotPassword, verifyCode, resetPassword };
