const jwt = require('jsonwebtoken');

const generateAccessToken = (userId) => {
  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret) {
    throw new Error('ACCESS_TOKEN_SECRET environment variable is missing.');
  }
  return jwt.sign({ id: userId }, secret.trim(), {
    expiresIn: '15m',
  });
};

const generateRefreshToken = (userId) => {
  const secret = process.env.REFRESH_TOKEN_SECRET;
  if (!secret) {
    throw new Error('REFRESH_TOKEN_SECRET environment variable is missing.');
  }
  return jwt.sign({ id: userId }, secret.trim(), {
    expiresIn: '7d',
  });
};

module.exports = { generateAccessToken, generateRefreshToken };
