import mongoose from 'mongoose';

import { CUSTOMER_TYPES, ORDER_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES } from '../utils/constants.js';

export { ORDER_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES, CUSTOMER_TYPES };

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customerType: { type: String, enum: CUSTOMER_TYPES, default: 'INDIAN', index: true },
    // Snapshot of who ordered (so later profile changes never alter old orders).
    customer: { name: String, email: String, phone: String },
    items: [
      {
        _id: false,
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        name: String,
        sku: String,
        image: String,
        price: Number, // unit price in the order's currency, taken from the DB at order time
        quantity: Number,
        lineTotal: Number,
      },
    ],
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      email: String,
      line1: { type: String, required: true },
      line2: String,
      city: { type: String, required: true },
      state: String,
      postalCode: String,
      country: { type: String, default: 'India' },
    },
    country: { type: String, index: true }, // copy of shippingAddress.country for filtering
    paymentMethod: { type: String, enum: PAYMENT_METHODS, default: 'cod' },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'pending', index: true },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending', index: true },
    statusHistory: [{ _id: false, status: String, note: String, at: { type: Date, default: Date.now } }],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    shippingMethod: { type: String, default: '' },
    currency: { type: String, default: 'INR' },
    baseCurrency: { type: String, default: 'INR' },
    exchangeRate: { type: Number, default: 1 }, // 1 base-currency unit = exchangeRate order-currency units
    trackingNumber: { type: String, default: '' },
    courier: { type: String, default: '' },
    // true once the reserved stock was returned to inventory (prevents double restock). Absent on legacy orders.
    stockReleased: Boolean,
    idempotencyKey: String,
    total: { type: Number, required: true },
    couponCode: { type: String, default: '' },
    notes: { type: String, default: '' },
    razorpay: {
      orderId: String,
      paymentId: String,
      signature: String,
    },
  },
  { timestamps: true }
);

orderSchema.index(
  { user: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } }
);
orderSchema.index({ createdAt: -1 });

orderSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    if (ret.razorpay) delete ret.razorpay.signature;
    delete ret.idempotencyKey;
    return ret;
  },
});

export default mongoose.model('Order', orderSchema);
