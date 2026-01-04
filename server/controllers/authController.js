const User = require('../models/User');
const Identity = require('../models/Identity');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const { welcomeEmail, passwordResetEmail } = require('../utils/emailTemplates');

const registerUser = async (req, res) => {
  const { email, password, realName } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // No verification token needed anymore
    const user = await User.create({
      email,
      password,
      isVerified: true, // Auto-verify
    });

    if (user) {
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
        handle: `@anon_${user._id.toString().slice(-6)}`,
      });

      // Generate Tokens for Auto-Login
      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      user.refreshToken.push(refreshToken);
      await user.save();

      res.cookie('jwt', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Send WELCOME email safely
      // try {
      //   await sendEmail({
      //     to: email,
      //     subject: 'Welcome to Calmly',
      //     html: welcomeEmail(realName)
      //   });
      // } catch (emailError) {
      //   console.error("Email failed to send:", emailError.message);
      //   // Continue without failing the request
      // }

      res.status(201).json({
          _id: user._id,
          email: user.email,
          accessToken,
          message: 'Registration successful! Welcome.',
      });

    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  console.log("Logging in user:", email);

  try {
    const user = await User.findOne({ email });

    if (!user) {
        console.log("User not found for login:", email);
        return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    console.log("Password match:", isMatch);

    if (isMatch) {
      // Removed isVerified check

      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      user.refreshToken.push(refreshToken);
      await user.save();

      res.cookie('jwt', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
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

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetTokenHash = crypto.createHash('sha256').update(resetCode).digest('hex');

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    // Send styled password reset email
    const emailSent = await sendEmail({
      to: user.email,
      subject: 'Reset Password Code',
      html: passwordResetEmail(resetCode)
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
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(204);

    const refreshToken = cookies.jwt;
    const user = await User.findOne({ refreshToken }).exec();

    if (user) {
        user.refreshToken = user.refreshToken.filter(rt => rt !== refreshToken);
        await user.save();
    }

    res.clearCookie('jwt', {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
        secure: process.env.NODE_ENV === 'production'
    });
    res.sendStatus(204);
}

module.exports = { registerUser, loginUser, logoutUser, refreshToken, forgotPassword, verifyCode, resetPassword };
