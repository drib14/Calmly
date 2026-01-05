const jwt = require('jsonwebtoken');

const generateAccessToken = (userId) => {
  const secret = process.env.ACCESS_TOKEN_SECRET ? process.env.ACCESS_TOKEN_SECRET.trim() : 'fallback_secret';
  if (secret === 'fallback_secret') console.warn('Warning: ACCESS_TOKEN_SECRET is missing, using fallback');
  return jwt.sign({ id: userId }, secret, {
    expiresIn: '15m',
  });
};

const generateRefreshToken = (userId) => {
  const secret = process.env.REFRESH_TOKEN_SECRET ? process.env.REFRESH_TOKEN_SECRET.trim() : 'fallback_refresh_secret';
  return jwt.sign({ id: userId }, secret, {
    expiresIn: '7d',
  });
};

module.exports = { generateAccessToken, generateRefreshToken };
