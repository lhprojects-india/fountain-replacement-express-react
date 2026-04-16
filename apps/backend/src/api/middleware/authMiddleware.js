import jwt from 'jsonwebtoken';
import { JWT_SECRET, jwtVerifyOptions } from '../../lib/jwt.js';
import logger from '../../lib/logger.js';
import { ForbiddenError, UnauthorizedError } from '../../lib/errors.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(new UnauthorizedError('Access denied. No token provided.'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, jwtVerifyOptions);
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn({ msg: 'Invalid token', error: error?.message || error });
    return next(new ForbiddenError('Invalid or expired token.'));
  }
};

export const authorizeAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    next(new ForbiddenError('Access denied. Admin privileges required.'));
  }
};
