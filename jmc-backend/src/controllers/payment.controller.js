import Order from '../models/Order.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/response.js';
import { assertObjectId } from '../utils/helpers.js';
import { createRazorpayOrder, verifyRazorpaySignature } from '../services/razorpay.js';

const loadOwnOrder = async (userId, orderId) => {
  assertObjectId(orderId, 'orderId');
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) throw new ApiError(404, 'Order not found');
  return order;
};

export const createPaymentOrder = async (req, res) => {
  const order = await loadOwnOrder(req.user._id, req.body.orderId);
  if (order.paymentMethod !== 'razorpay') throw new ApiError(400, 'This order is not set to online payment');
  if (order.paymentStatus === 'paid') throw new ApiError(400, 'This order is already paid');
  if (['cancelled', 'refunded'].includes(order.status)) throw new ApiError(400, 'This order can no longer be paid');

  const rzp = await createRazorpayOrder({ amount: order.total, receipt: order.orderNumber });
  order.razorpay = { ...(order.razorpay || {}), orderId: rzp.id };
  await order.save();

  sendSuccess(res, {
    orderId: order._id,
    razorpayOrderId: rzp.id,
    amount: rzp.amount, // paise
    currency: rzp.currency,
    keyId: env.razorpay.keyId, // public key id only
  }, 'Payment order created');
};

export const verifyPayment = async (req, res) => {
  const { orderId, razorpay_order_id: rpOrderId, razorpay_payment_id: rpPaymentId, razorpay_signature: rpSignature } = req.body;
  if (!rpOrderId || !rpPaymentId || !rpSignature) throw new ApiError(400, 'Missing Razorpay payment details');

  const order = await loadOwnOrder(req.user._id, orderId);
  if (!order.razorpay?.orderId || order.razorpay.orderId !== rpOrderId) throw new ApiError(400, 'Payment does not match this order');

  const valid = verifyRazorpaySignature({ orderId: rpOrderId, paymentId: rpPaymentId, signature: rpSignature });
  if (!valid) {
    order.paymentStatus = 'failed';
    await order.save();
    throw new ApiError(400, 'Payment verification failed');
  }

  order.paymentStatus = 'paid';
  order.razorpay.paymentId = rpPaymentId;
  order.razorpay.signature = rpSignature;
  if (order.status === 'pending') {
    order.status = 'confirmed';
    order.statusHistory.push({ status: 'confirmed', note: 'Payment received' });
  }
  await order.save();
  sendSuccess(res, { order }, 'Payment verified successfully');
};
