import Order from '../models/Order.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/response.js';
import { assertObjectId } from '../utils/helpers.js';
import { toMinorUnits } from '../utils/currency.js';
import { createRazorpayOrder, verifyRazorpaySignature } from '../services/razorpay.js';

const loadOwnOrder = async (userId, orderId) => {
  assertObjectId(orderId, 'orderId');
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) throw new ApiError(404, 'Order not found');
  return order;
};

/** Creates (or re-creates, for a retry) a Razorpay order for an unpaid online-payment order. */
export const startPayment = async (req, res, orderId) => {
  const order = await loadOwnOrder(req.user._id, orderId);
  if (order.paymentMethod !== 'razorpay') throw new ApiError(400, 'This order is not set to online payment');
  if (order.paymentStatus === 'paid') throw new ApiError(400, 'This order is already paid');
  if (!['pending'].includes(order.status)) throw new ApiError(400, 'This order can no longer be paid');
  if (!env.razorpay.currencies.includes(order.currency)) {
    throw new ApiError(400, `Online payment is not available in ${order.currency}`);
  }

  // Amount and currency always come from the stored order, never from the request.
  const rzp = await createRazorpayOrder({ amount: order.total, currency: order.currency, receipt: order.orderNumber });
  const isRetry = Boolean(order.razorpay?.orderId);
  order.razorpay = { orderId: rzp.id }; // a retry replaces the earlier attempt; old payment details are cleared
  order.paymentStatus = 'pending';
  if (isRetry) order.statusHistory.push({ status: order.status, note: 'Payment retry started' });
  await order.save();

  sendSuccess(res, {
    orderId: order._id,
    razorpayOrderId: rzp.id,
    amount: rzp.amount ?? toMinorUnits(order.total), // smallest currency unit
    currency: rzp.currency || order.currency,
    keyId: env.razorpay.keyId, // public key id only
  }, 'Payment order created');
};

export const createPaymentOrder = (req, res) => startPayment(req, res, req.body.orderId);

export const verifyPayment = async (req, res) => {
  const { orderId, razorpay_order_id: rpOrderId, razorpay_payment_id: rpPaymentId, razorpay_signature: rpSignature } = req.body;
  if (!rpOrderId || !rpPaymentId || !rpSignature) throw new ApiError(400, 'Missing Razorpay payment details');

  const order = await loadOwnOrder(req.user._id, orderId);

  // Duplicate callback for a payment we already accepted: succeed idempotently, change nothing.
  if (order.paymentStatus === 'paid') {
    if (order.razorpay?.paymentId === rpPaymentId) return sendSuccess(res, { order }, 'Payment already verified');
    throw new ApiError(409, 'This order has already been paid');
  }
  if (order.paymentMethod !== 'razorpay') throw new ApiError(400, 'This order is not set to online payment');
  if (!order.razorpay?.orderId || order.razorpay.orderId !== rpOrderId) throw new ApiError(400, 'Payment does not match this order');

  const valid = verifyRazorpaySignature({ orderId: rpOrderId, paymentId: rpPaymentId, signature: rpSignature });
  if (!valid) {
    order.paymentStatus = 'failed';
    order.statusHistory.push({ status: order.status, note: 'Payment verification failed' });
    await order.save();
    throw new ApiError(400, 'Payment verification failed');
  }

  // Atomic transition: only one concurrent callback can flip pending/failed -> paid.
  const updated = await Order.findOneAndUpdate(
    { _id: order._id, paymentStatus: { $ne: 'paid' }, 'razorpay.orderId': rpOrderId },
    {
      $set: {
        paymentStatus: 'paid',
        'razorpay.paymentId': rpPaymentId,
        'razorpay.signature': rpSignature,
        ...(order.status === 'pending' && { status: 'confirmed' }),
      },
      $push: { statusHistory: { status: order.status === 'pending' ? 'confirmed' : order.status, note: 'Payment received', at: new Date() } },
    },
    { new: true }
  );
  if (!updated) {
    const fresh = await Order.findById(order._id);
    if (fresh?.paymentStatus === 'paid' && fresh.razorpay?.paymentId === rpPaymentId) {
      return sendSuccess(res, { order: fresh }, 'Payment already verified');
    }
    throw new ApiError(409, 'Could not record this payment. Please contact support.');
  }
  sendSuccess(res, { order: updated }, 'Payment verified successfully');
};

/** Frontend reports a failed/dismissed Razorpay attempt. Never overrides a paid order. The customer may retry. */
export const reportPaymentFailure = async (req, res) => {
  const order = await loadOwnOrder(req.user._id, req.body.orderId);
  if (order.paymentStatus !== 'paid' && order.paymentMethod === 'razorpay') {
    order.paymentStatus = 'failed';
    order.statusHistory.push({ status: order.status, note: 'Payment attempt failed' });
    await order.save();
  }
  sendSuccess(res, { order }, 'Payment failure recorded');
};
