import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

export const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

export const protect = async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) throw new ApiError(401, 'Authentication required. Please log in.');

  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET);
  } catch {
    throw new ApiError(401, 'Invalid or expired token. Please log in again.');
  }

  const user = await User.findById(payload.id);
  if (!user || !user.active) throw new ApiError(401, 'Account not found or disabled.');
  req.user = user;
  next();
};

/**
 * Customer cart / checkout / payments reveal product prices, which are private.
 * They stay off (403) unless ONLINE_ORDERING_ENABLED=true. Admin APIs are unaffected.
 */
export const requireOrderingEnabled = (_req, _res, next) => {
  if (!env.ONLINE_ORDERING_ENABLED) {
    throw new ApiError(403, 'Online ordering is currently unavailable. Please enquire on WhatsApp.');
  }
  next();
};

export const adminOnly = (req, _res, next) => {
  if (req.user?.role !== 'admin') throw new ApiError(403, 'Admin access required.');
  next();
};
