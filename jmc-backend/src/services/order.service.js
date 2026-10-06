import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import Order from '../models/Order.js';
import ShippingRule from '../models/ShippingRule.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { assertObjectId } from '../utils/helpers.js';
import { getRate, resolveCurrency, round2 } from '../utils/currency.js';

/* ------------------------------- Addresses ------------------------------ */

const str = (v, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export const isIndia = (country) => ['india', 'in', 'ind', 'bharat'].includes(String(country || '').trim().toLowerCase());

/** Accepts line1/line2 (project convention) or addressLine1/addressLine2. Returns a clean plain object. */
export const normaliseAddress = (input = {}) => ({
  label: str(input.label, 50),
  fullName: str(input.fullName, 100),
  phone: str(input.phone, 30),
  email: str(input.email, 120).toLowerCase(),
  line1: str(input.line1 ?? input.addressLine1),
  line2: str(input.line2 ?? input.addressLine2),
  city: str(input.city, 100),
  state: str(input.state, 100),
  postalCode: str(input.postalCode, 20),
  country: isIndia(input.country) ? 'India' : str(input.country, 100),
});

export const validateAddress = (a) => {
  const errors = [];
  ['fullName', 'phone', 'line1', 'city', 'country'].forEach((f) => {
    if (!a[f]) errors.push(`${f} is required`);
  });
  if (a.phone && !/^[0-9+()\-\s]{6,30}$/.test(a.phone)) errors.push('phone is not valid');
  if (a.email && !/^\S+@\S+\.\S+$/.test(a.email)) errors.push('email is not valid');
  if (errors.length) throw new ApiError(400, errors[0], errors);
  return a;
};

/** Marks exactly one address as default (the given id, else keeps the existing one, else the first). */
export const applyDefaultAddress = (user, defaultId) => {
  if (!user.addresses.length) return;
  const keep = defaultId
    ? user.addresses.find((a) => a.equals?.(defaultId) || String(a._id) === String(defaultId))
    : user.addresses.find((a) => a.isDefault) || user.addresses[0];
  user.addresses.forEach((a) => { a.isDefault = a === keep; });
};

/**
 * Picks the delivery address for a quote/order: a saved address (`addressId`) or an inline one
 * (`shippingAddress`). Returns a plain snapshot object. Only `country` is required when `countryOnly`.
 */
export const resolveAddress = (user, body, { countryOnly = false } = {}) => {
  if (body.addressId) {
    assertObjectId(body.addressId, 'addressId');
    const saved = user.addresses.id(body.addressId);
    if (!saved) throw new ApiError(404, 'Saved address not found');
    const { label, fullName, phone, email, line1, line2, city, state, postalCode, country } = saved.toObject();
    return { label, fullName, phone, email, line1, line2, city, state, postalCode, country };
  }
  const raw = body.shippingAddress && typeof body.shippingAddress === 'object' ? body.shippingAddress : null;
  if (countryOnly && !raw) {
    const country = isIndia(body.country) ? 'India' : str(body.country, 100);
    if (!country) throw new ApiError(400, 'country, addressId or shippingAddress is required');
    return { country };
  }
  if (!raw) throw new ApiError(400, 'A delivery address is required (addressId or shippingAddress)');
  const address = normaliseAddress(raw);
  // Indian customers keep the legacy default; everyone else must state the destination country.
  if (!address.country && user.customerType === 'INDIAN') address.country = 'India';
  if (countryOnly) {
    if (!address.country) throw new ApiError(400, 'country is required');
    return address;
  }
  return validateAddress(address);
};

/* --------------------------------- Lines -------------------------------- */

/** Order lines come from the request body, or from the saved cart if none are sent. */
export const resolveLines = async (req, CartModel) => {
  let lines = Array.isArray(req.body.items) ? req.body.items : [];
  const usingCart = lines.length === 0;
  if (usingCart) {
    const cart = await CartModel.findOne({ user: req.user._id });
    lines = (cart?.items || []).map((i) => ({ productId: String(i.product), quantity: i.quantity }));
  }
  if (!lines.length) throw new ApiError(400, 'No items to order');
  if (lines.length > 50) throw new ApiError(400, 'Too many items in one order');
  return { lines, usingCart };
};

/* -------------------------------- Shipping ------------------------------ */

/** Shipping from the admin-managed ShippingRule collection. Fees are in the base currency. */
export const calculateShipping = async ({ country, subtotalBase, quantity }) => {
  const c = String(country).trim().toLowerCase();
  const rules = await ShippingRule.find({ active: true }).sort({ priority: 1, createdAt: 1 });
  const rule = rules.find((r) => r.countries.includes(c)) || rules.find((r) => r.countries.includes('*'));
  if (!rule) {
    // Legacy behaviour: domestic orders were always free-shipping.
    if (isIndia(country)) return { feeBase: 0, rule: null };
    throw new ApiError(400, `We do not ship to ${country} yet. Please contact us on WhatsApp.`);
  }
  const free = rule.freeAbove !== null && rule.freeAbove !== undefined && subtotalBase >= rule.freeAbove;
  return { feeBase: free ? 0 : rule.baseFee + rule.perItemFee * quantity, rule };
};

/* --------------------------------- Coupons ------------------------------ */

const calcDiscount = (coupon, subtotal) => {
  let d = coupon.type === 'percent' ? (subtotal * coupon.value) / 100 : coupon.value;
  if (coupon.maxDiscount) d = Math.min(d, coupon.maxDiscount);
  return Math.round(Math.min(d, subtotal));
};

const loadCoupon = async (code, subtotalBase) => {
  const coupon = await Coupon.findOne({ code: String(code).trim().toUpperCase(), active: true });
  if (!coupon) throw new ApiError(400, 'Invalid coupon code');
  if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new ApiError(400, 'This coupon has expired');
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) throw new ApiError(400, 'This coupon has reached its usage limit');
  if (subtotalBase < coupon.minOrderAmount) {
    throw new ApiError(400, `Minimum order amount for this coupon is ${env.currency.base} ${coupon.minOrderAmount}`);
  }
  return coupon;
};

/* ---------------------------------- Quote ------------------------------- */

/**
 * The single place where an order total is calculated. EVERYTHING comes from the database
 * (product price/stock/active, shipping rules, coupon, configured exchange rate).
 * Nothing price-related from the client is ever read.
 */
export const buildQuote = async ({ lines, country, currency: requestedCurrency, couponCode }) => {
  const currency = resolveCurrency(requestedCurrency);
  const rate = getRate(currency);

  const merged = new Map();
  for (const l of lines) {
    assertObjectId(l?.productId, 'productId');
    const q = Number(l.quantity ?? 1);
    if (!Number.isInteger(q) || q < 1 || q > 100) throw new ApiError(400, 'Quantity must be a whole number between 1 and 100');
    merged.set(String(l.productId), (merged.get(String(l.productId)) || 0) + q);
  }

  const products = await Product.find({ _id: { $in: [...merged.keys()] }, active: true });
  if (products.length !== merged.size) throw new ApiError(400, 'One or more products are unavailable');
  const byId = new Map(products.map((p) => [String(p._id), p]));

  const abroad = !isIndia(country);
  let subtotalBase = 0;
  let quantity = 0;
  const items = [...merged.entries()].map(([id, qty]) => {
    const p = byId.get(id);
    if (qty > p.stock) throw new ApiError(400, `Only ${p.stock} unit(s) of "${p.name}" are in stock`);
    if (abroad && !p.internationalShipping) throw new ApiError(400, `"${p.name}" cannot be shipped outside India`);
    subtotalBase += p.price * qty;
    quantity += qty;
    const price = round2(p.price * rate);
    return {
      product: p._id, name: p.name, sku: p.sku, image: p.images?.[0]?.url || '',
      price, quantity: qty, lineTotal: round2(price * qty),
    };
  });

  const subtotal = round2(items.reduce((n, i) => n + i.lineTotal, 0));
  let discount = 0;
  let coupon = null;
  if (couponCode) {
    coupon = await loadCoupon(couponCode, subtotalBase);
    discount = round2(calcDiscount(coupon, subtotalBase) * rate);
  }
  const { feeBase, rule } = await calculateShipping({ country, subtotalBase, quantity });
  const shippingFee = round2(feeBase * rate);
  const total = round2(subtotal - discount + shippingFee);

  return {
    items, subtotal, discount, shippingFee, total, currency, baseCurrency: env.currency.base,
    exchangeRate: rate, shippingMethod: rule?.name || '', estimatedDays: rule?.estimatedDays || '', coupon,
  };
};

/* ---------------------------------- Stock ------------------------------- */

/** Reserve stock atomically; rolls back if any line fails. */
export const reserveStock = async (items) => {
  const reserved = [];
  try {
    for (const i of items) {
      const r = await Product.updateOne({ _id: i.product, stock: { $gte: i.quantity } }, { $inc: { stock: -i.quantity } });
      if (r.modifiedCount !== 1) throw new ApiError(409, `"${i.name}" just went out of stock`);
      reserved.push(i);
    }
  } catch (err) {
    await restoreStock(reserved);
    throw err;
  }
};

export const restoreStock = (items) =>
  Promise.all(items.map((i) => Product.updateOne({ _id: i.product }, { $inc: { stock: i.quantity } })));

/**
 * Returns an order's reserved stock to inventory exactly once (atomic claim on `stockReleased`).
 * Legacy orders (no flag) that are already cancelled/refunded were restocked by the old code: skip them.
 */
export const releaseOrderStock = async (order) => {
  if (order.stockReleased === undefined && ['cancelled', 'refunded'].includes(order.status)) return false;
  const claim = await Order.updateOne({ _id: order._id, stockReleased: { $ne: true } }, { $set: { stockReleased: true } });
  if (claim.modifiedCount !== 1) return false;
  await restoreStock(order.items);
  order.stockReleased = true;
  return true;
};

export const isValidId = (id) => mongoose.isValidObjectId(id);
