import crypto from 'crypto';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export const isRazorpayConfigured = () => Boolean(env.razorpay.keyId && env.razorpay.keySecret);

const assertConfigured = () => {
  if (!isRazorpayConfigured()) {
    throw new ApiError(503, 'Online payments are not configured. Use Cash on Delivery or set the RAZORPAY_* environment variables.');
  }
};

/** Creates a Razorpay order via REST (no SDK needed). amount is in rupees. */
export const createRazorpayOrder = async ({ amount, receipt }) => {
  assertConfigured();
  const auth = Buffer.from(`${env.razorpay.keyId}:${env.razorpay.keySecret}`).toString('base64');
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
    body: JSON.stringify({ amount: Math.round(amount * 100), currency: 'INR', receipt }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(502, body?.error?.description || 'Could not create payment order');
  return body;
};

export const verifyRazorpaySignature = ({ orderId, paymentId, signature }) => {
  assertConfigured();
  const expected = crypto
    .createHmac('sha256', env.razorpay.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};
