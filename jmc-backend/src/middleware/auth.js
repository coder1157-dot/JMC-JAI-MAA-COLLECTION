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

/** Attaches req.user when a valid token is sent; silently continues as a guest otherwise. */
export const optionalAuth = async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (token) {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET);
      const user = await User.findById(payload.id);
      if (user && user.active) req.user = user;
    } catch {
      // invalid/expired token: treat as guest
    }
  }
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

/**
 * Cart / checkout / payments are open to INTERNATIONAL customers.
 * INDIAN customers stay enquiry-only unless the legacy ONLINE_ORDERING_ENABLED flag is turned on.
 * Must run after `protect`.
 */
export const requireOrderingAccess = (req, _res, next) => {
  if (env.ONLINE_ORDERING_ENABLED) return next();
  if (env.INTERNATIONAL_ORDERING_ENABLED && req.user?.customerType === 'INTERNATIONAL') return next();
  throw new ApiError(403, 'Online ordering is not available for this account. Please enquire on WhatsApp.');
};

export const adminOnly = (req, _res, next) => {
  if (req.user?.role !== 'admin') throw new ApiError(403, 'Admin access required.');
  next();
};
