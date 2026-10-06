import crypto from 'crypto';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Coupon from '../models/Coupon.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/response.js';
import { assertObjectId, buildPagination, parsePagination } from '../utils/helpers.js';
import { env } from '../config/env.js';
import { normaliseEnum, ORDER_STATUSES, PAYMENT_METHODS } from '../utils/constants.js';
import {
  buildQuote, releaseOrderStock, reserveStock, resolveAddress, resolveLines, restoreStock,
} from '../services/order.service.js';

const newOrderNumber = () =>
  `JMC-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

const CANCELLABLE = ['pending', 'confirmed'];

const quoteView = (q) => ({
  items: q.items, subtotal: q.subtotal, discount: q.discount, shippingFee: q.shippingFee, total: q.total,
  currency: q.currency, shippingMethod: q.shippingMethod, estimatedDays: q.estimatedDays,
});

/** POST /orders/quote — server-side price/shipping/total preview. Nothing is created or reserved. */
export const quoteOrder = async (req, res) => {
  const address = resolveAddress(req.user, req.body, { countryOnly: true });
  const { lines } = await resolveLines(req, Cart);
  const quote = await buildQuote({ lines, country: address.country, currency: req.body.currency, couponCode: req.body.couponCode });
  sendSuccess(res, { quote: quoteView(quote) }, 'Quote calculated');
};

export const createOrder = async (req, res) => {
  const method = normaliseEnum(req.body.paymentMethod ?? 'cod', PAYMENT_METHODS);
  if (!method) throw new ApiError(400, 'paymentMethod must be "COD" or "RAZORPAY"');

  // Duplicate-submit protection: same Idempotency-Key from the same user returns the original order.
  const rawKey = req.get('Idempotency-Key') || req.body.idempotencyKey;
  const idempotencyKey = typeof rawKey === 'string' && rawKey.trim() ? rawKey.trim().slice(0, 100) : undefined;
  if (idempotencyKey) {
    const prior = await Order.findOne({ user: req.user._id, idempotencyKey });
    if (prior) return sendSuccess(res, { order: prior, duplicate: true }, 'Order already placed');
  }

  const address = resolveAddress(req.user, req.body);
  const { lines, usingCart } = await resolveLines(req, Cart);
  const quote = await buildQuote({ lines, country: address.country, currency: req.body.currency, couponCode: req.body.couponCode });

  if (method === 'razorpay' && !env.razorpay.currencies.includes(quote.currency)) {
    throw new ApiError(400, `Online payment is not available in ${quote.currency}. Choose ${env.razorpay.currencies.join('/')} or Cash on Delivery.`);
  }

  await reserveStock(quote.items);

  let order;
  try {
    order = await Order.create({
      orderNumber: newOrderNumber(),
      user: req.user._id,
      customerType: req.user.customerType || 'INDIAN',
      customer: { name: address.fullName, email: address.email || req.user.email, phone: address.phone },
      items: quote.items,
      shippingAddress: address, // SNAPSHOT: later edits to saved addresses never touch this
      country: address.country,
      paymentMethod: method,
      paymentStatus: 'pending', // COD stays pending until delivery; Razorpay until signature verified
      subtotal: quote.subtotal,
      discount: quote.discount,
      shippingFee: quote.shippingFee,
      shippingMethod: quote.shippingMethod,
      total: quote.total,
      currency: quote.currency,
      baseCurrency: quote.baseCurrency,
      exchangeRate: quote.exchangeRate,
      couponCode: quote.coupon?.code || '',
      notes: typeof req.body.notes === 'string' ? req.body.notes.slice(0, 500) : '',
      idempotencyKey,
      stockReleased: false,
      statusHistory: [{ status: 'pending', note: method === 'cod' ? 'Order placed (Cash on Delivery)' : 'Order placed, awaiting payment' }],
    });
  } catch (err) {
    await restoreStock(quote.items);
    if (err.code === 11000 && idempotencyKey) {
      const prior = await Order.findOne({ user: req.user._id, idempotencyKey });
      if (prior) return sendSuccess(res, { order: prior, duplicate: true }, 'Order already placed');
    }
    throw err;
  }

  if (quote.coupon) await Coupon.updateOne({ _id: quote.coupon._id }, { $inc: { usedCount: 1 } });
  if (usingCart) await Cart.updateOne({ user: req.user._id }, { $set: { items: [] } });

  sendSuccess(res, { order, requiresPayment: method === 'razorpay' }, 'Order placed successfully', 201);
};

export const getMyOrders = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, 10);
  const filter = { user: req.user._id };
  const status = normaliseEnum(req.query.status, ORDER_STATUSES);
  if (status) filter.status = status;
  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);
  sendSuccess(res, { orders, pagination: buildPagination(page, limit, total) }, 'Orders fetched successfully');
};

// Ownership is enforced in the query itself: someone else's id simply yields 404.
export const getMyOrder = async (req, res) => {
  assertObjectId(req.params.id, 'order id');
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) throw new ApiError(404, 'Order not found');
  sendSuccess(res, { order }, 'Order fetched successfully');
};

export const cancelMyOrder = async (req, res) => {
  assertObjectId(req.params.id, 'order id');
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) throw new ApiError(404, 'Order not found');
  if (!CANCELLABLE.includes(order.status)) {
    throw new ApiError(400, 'This order can no longer be cancelled. Please contact us on WhatsApp.');
  }
  const paid = order.paymentStatus === 'paid';
  order.status = 'cancelled';
  order.statusHistory.push({
    status: 'cancelled',
    note: `Cancelled by customer${paid ? ' (payment received: refund to be processed)' : ''}`,
  });
  await order.save();
  await releaseOrderStock(order);
  sendSuccess(res, { order }, paid ? 'Order cancelled. Your refund will be processed.' : 'Order cancelled');
};
