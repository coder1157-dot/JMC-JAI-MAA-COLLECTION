import User from '../models/User.js';
import { signToken } from '../middleware/auth.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/response.js';

const str = (v) => (typeof v === 'string' ? v.trim() : '');

export const register = async (req, res) => {
  const name = str(req.body.name);
  const email = str(req.body.email).toLowerCase();
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const errors = [];
  if (!name) errors.push('Name is required');
  if (!/^\S+@\S+\.\S+$/.test(email)) errors.push('A valid email is required');
  if (password.length < 8) errors.push('Password must be at least 8 characters');
  if (errors.length) throw new ApiError(400, errors[0], errors);

  if (await User.exists({ email })) throw new ApiError(409, 'An account with this email already exists');

  // role is never taken from the request body: public signup is always a customer.
  const user = await User.create({ name, email, password, phone: str(req.body.phone), role: 'customer' });
  sendSuccess(res, { user, token: signToken(user) }, 'Registration successful', 201);
};

const loginWithRole = (requiredRole) => async (req, res) => {
  const email = str(req.body.email).toLowerCase();
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  if (!email || !password) throw new ApiError(400, 'Email and password are required');

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) throw new ApiError(401, 'Invalid email or password');
  if (!user.active) throw new ApiError(403, 'This account has been disabled');
  if (requiredRole && user.role !== requiredRole) throw new ApiError(403, 'Admin access required');

  sendSuccess(res, { user, token: signToken(user) }, 'Login successful');
};

export const login = loginWithRole(null);
export const adminLogin = loginWithRole('admin');

export const getMe = async (req, res) => sendSuccess(res, { user: req.user }, 'Profile fetched successfully');

export const updateProfile = async (req, res) => {
  if (req.body.name !== undefined) {
    if (!str(req.body.name)) throw new ApiError(400, 'Name cannot be empty');
    req.user.name = str(req.body.name);
  }
  if (req.body.phone !== undefined) req.user.phone = str(req.body.phone);
  await req.user.save();
  sendSuccess(res, { user: req.user }, 'Profile updated successfully');
};
