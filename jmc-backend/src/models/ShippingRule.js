import mongoose from 'mongoose';

// Amounts are in the base currency (BASE_CURRENCY, same as Product.price) and converted at checkout.
const shippingRuleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    // Lower-case country names, or '*' as the catch-all rule.
    countries: {
      type: [String],
      default: ['*'],
      set: (v) => [...new Set((Array.isArray(v) ? v : [v]).map((c) => String(c).trim().toLowerCase()).filter(Boolean))],
    },
    baseFee: { type: Number, default: 0, min: 0 },
    perItemFee: { type: Number, default: 0, min: 0 },
    freeAbove: { type: Number, default: null, min: 0 }, // subtotal (base currency) at/above which shipping is free
    estimatedDays: { type: String, default: '', trim: true, maxlength: 50 },
    priority: { type: Number, default: 100 }, // lower wins when several rules match
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

shippingRuleSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('ShippingRule', shippingRuleSchema);
