
const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../utils/jwtSecret');

// JWT Authentication Middleware
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, getJwtSecret());

    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({
      message: 'Invalid or expired token.'
    });
  }
};

module.exports = verifyToken;
