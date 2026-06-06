const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'finora-dev-secret-change-in-production';

const auth = (req, res, next) => {
  const token = req.headers['authorization']?.replace('Bearer ', '') || req.headers['x-auth-token'];
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.userId;
      return next();
    } catch (e) {
      // fall through to x-user-id for backward compat
    }
  }
  const legacyId = req.headers['x-user-id'];
  if (legacyId) {
    req.userId = parseInt(legacyId, 10);
    return next();
  }
  res.status(401).json({ error: 'Authentification requise' });
};

const optionalAuth = (req, res, next) => {
  const token = req.headers['authorization']?.replace('Bearer ', '') || req.headers['x-auth-token'];
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.userId;
    } catch (e) {}
  }
  next();
};

module.exports = { auth, optionalAuth, JWT_SECRET };
