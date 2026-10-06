import User from '../models/User.js';
import { signToken } from '../middleware/auth.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/response.js';
import { normaliseCustomerType } from '../utils/constants.js';
import { applyDefaultAddress, normaliseAddress, validateAddress } from '../services/order.service.js';
import { assertObjectId } from '../utils/helpers.js';

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
  const customerType = req.body.customerType === undefined ? 'INDIAN' : normaliseCustomerType(req.body.customerType);
  if (!customerType) throw new ApiError(400, 'customerType must be INDIAN or INTERNATIONAL');
  const user = await User.create({ name, email, password, phone: str(req.body.phone), role: 'customer', customerType });
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
  if (req.body.customerType !== undefined) {
    const t = normaliseCustomerType(req.body.customerType);
    if (!t) throw new ApiError(400, 'customerType must be INDIAN or INTERNATIONAL');
    req.user.customerType = t;
  }
  await req.user.save();
  sendSuccess(res, { user: req.user }, 'Profile updated successfully');
};

/* ----------------------------- Saved addresses ---------------------------- */
// Editing a saved address never alters past orders: orders keep their own address snapshot.

const MAX_ADDRESSES = 10;

export const listAddresses = async (req, res) =>
  sendSuccess(res, { addresses: req.user.addresses }, 'Addresses fetched successfully');

export const addAddress = async (req, res) => {
  if (req.user.addresses.length >= MAX_ADDRESSES) throw new ApiError(400, `You can save at most ${MAX_ADDRESSES} addresses`);
  const address = validateAddress(normaliseAddress(req.body));
  req.user.addresses.push(address);
  const added = req.user.addresses[req.user.addresses.length - 1];
  applyDefaultAddress(req.user, req.body.isDefault === true || req.user.addresses.length === 1 ? added._id : undefined);
  await req.user.save();
  sendSuccess(res, { addresses: req.user.addresses }, 'Address saved', 201);
};

export const updateAddress = async (req, res) => {
  assertObjectId(req.params.addressId, 'addressId');
  const addr = req.user.addresses.id(req.params.addressId);
  if (!addr) throw new ApiError(404, 'Address not found');
  const merged = validateAddress(normaliseAddress({ ...addr.toObject(), ...req.body }));
  addr.set(merged);
  applyDefaultAddress(req.user, req.body.isDefault === true ? addr._id : undefined);
  await req.user.save();
  sendSuccess(res, { addresses: req.user.addresses }, 'Address updated');
};

export const deleteAddress = async (req, res) => {
  assertObjectId(req.params.addressId, 'addressId');
  const addr = req.user.addresses.id(req.params.addressId);
  if (!addr) throw new ApiError(404, 'Address not found');
  addr.deleteOne();
  applyDefaultAddress(req.user);
  await req.user.save();
  sendSuccess(res, { addresses: req.user.addresses }, 'Address deleted');
};
