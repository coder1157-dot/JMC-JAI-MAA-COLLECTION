import crypto from 'crypto';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import Coupon from '../models/Coupon.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/response.js';
import { assertObjectId, buildPagination, parsePagination } from '../utils/helpers.js';

const ADDRESS_FIELDS = ['fullName', 'phone', 'line1', 'city', 'state', 'postalCode'];

const newOrderNumber = () =>
  `JMC-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

const calcDiscount = (coupon, subtotal) => {
  let d = coupon.type === 'percent' ? (subtotal * coupon.value) / 100 : coupon.value;
  if (coupon.maxDiscount) d = Math.min(d, coupon.maxDiscount);
  return Math.round(Math.min(d, subtotal));
};

const loadCoupon = async (code, subtotal) => {
  const coupon = await Coupon.findOne({ code: String(code).trim().toUpperCase(), active: true });
  if (!coupon) throw new ApiError(400, 'Invalid coupon code');
  if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new ApiError(400, 'This coupon has expired');
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) throw new ApiError(400, 'This coupon has reached its usage limit');
  if (subtotal < coupon.minOrderAmount) throw new ApiError(400, `Minimum order amount for this coupon is ₹${coupon.minOrderAmount}`);
  return coupon;
};

export const createOrder = async (req, res) => {
  const { shippingAddress, paymentMethod = 'cod', couponCode, notes } = req.body;
  if (!['cod', 'razorpay'].includes(paymentMethod)) throw new ApiError(400, 'paymentMethod must be "cod" or "razorpay"');

  const missing = ADDRESS_FIELDS.filter((f) => !String(shippingAddress?.[f] ?? '').trim());
  if (missing.length) throw new ApiError(400, `Missing shipping address fields: ${missing.join(', ')}`, missing);

  // Items come from the request body, or from the saved cart if none are sent.
  let lines = Array.isArray(req.body.items) ? req.body.items : [];
  const usingCart = lines.length === 0;
  if (usingCart) {
    const cart = await Cart.findOne({ user: req.user._id });
    lines = (cart?.items || []).map((i) => ({ productId: String(i.product), quantity: i.quantity }));
  }
  if (!lines.length) throw new ApiError(400, 'No items to order');
  if (lines.length > 50) throw new ApiError(400, 'Too many items in one order');

  const merged = new Map();
  for (const l of lines) {
    assertObjectId(l.productId, 'productId');
    const q = Number(l.quantity ?? 1);
    if (!Number.isInteger(q) || q < 1 || q > 100) throw new ApiError(400, 'Quantity must be a whole number between 1 and 100');
    merged.set(String(l.productId), (merged.get(String(l.productId)) || 0) + q);
  }

  const products = await Product.find({ _id: { $in: [...merged.keys()] }, active: true });
  if (products.length !== merged.size) throw new ApiError(400, 'One or more products are unavailable');

  const country = String(shippingAddress.country || 'India').trim();
  const items = products.map((p) => {
    const quantity = merged.get(String(p._id));
    if (quantity > p.stock) throw new ApiError(400, `Only ${p.stock} unit(s) of "${p.name}" are in stock`);
    if (country.toLowerCase() !== 'india' && !p.internationalShipping) {
      throw new ApiError(400, `"${p.name}" cannot be shipped outside India`);
    }
    return { product: p._id, name: p.name, sku: p.sku, image: p.images?.[0]?.url || '', price: p.price, quantity };
  });

  const subtotal = items.reduce((n, i) => n + i.price * i.quantity, 0);
  let discount = 0;
  let coupon = null;
  if (couponCode) {
    coupon = await loadCoupon(couponCode, subtotal);
    discount = calcDiscount(coupon, subtotal);
  }
  const shippingFee = 0; // Free shipping. Adjust here if shipping charges are introduced.
  const total = subtotal - discount + shippingFee;

  // Reserve stock atomically; roll back if any line fails.
  const reserved = [];
  try {
    for (const i of items) {
      const r = await Product.updateOne({ _id: i.product, stock: { $gte: i.quantity } }, { $inc: { stock: -i.quantity } });
      if (r.modifiedCount !== 1) throw new ApiError(409, `"${i.name}" just went out of stock`);
      reserved.push(i);
    }
  } catch (err) {
    await Promise.all(reserved.map((i) => Product.updateOne({ _id: i.product }, { $inc: { stock: i.quantity } })));
    throw err;
  }

  const order = await Order.create({
    orderNumber: newOrderNumber(),
    user: req.user._id,
    items,
    shippingAddress: { ...shippingAddress, country },
    paymentMethod,
    subtotal,
    discount,
    shippingFee,
    total,
    couponCode: coupon?.code || '',
    notes: typeof notes === 'string' ? notes.slice(0, 500) : '',
    statusHistory: [{ status: 'pending', note: 'Order placed' }],
  });

  if (coupon) await Coupon.updateOne({ _id: coupon._id }, { $inc: { usedCount: 1 } });
  if (usingCart) await Cart.updateOne({ user: req.user._id }, { $set: { items: [] } });

  sendSuccess(res, { order }, 'Order placed successfully', 201);
};

export const getMyOrders = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, 10);
  const filter = { user: req.user._id };
  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);
  sendSuccess(res, { orders, pagination: buildPagination(page, limit, total) }, 'Orders fetched successfully');
};

export const getMyOrder = async (req, res) => {
  assertObjectId(req.params.id, 'order id');
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) throw new ApiError(404, 'Order not found');
  sendSuccess(res, { order }, 'Order fetched successfully');
};
