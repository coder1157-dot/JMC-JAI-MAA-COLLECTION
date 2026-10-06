// Shared enums. Stored values keep the project's existing lowercase convention
// (orders already use 'pending', 'out_for_delivery', 'cod', ...). Input is accepted in any case
// ("OUT_FOR_DELIVERY", "Out for Delivery", "out_for_delivery") via normaliseEnum().
export const CUSTOMER_TYPES = ['INDIAN', 'INTERNATIONAL'];

export const ORDER_STATUSES = [
  'pending', 'confirmed', 'processing', 'packed', 'shipped',
  'out_for_delivery', 'delivered', 'cancelled', 'refund_initiated', 'refunded',
];

export const PAYMENT_METHODS = ['cod', 'razorpay'];
export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

/** Returns the canonical lowercase value if `value` matches the list (case/space/hyphen-insensitive), else undefined. */
export const normaliseEnum = (value, list) => {
  if (typeof value !== 'string') return undefined;
  const v = value.trim().toLowerCase().replace(/[\s-]+/g, '_');
  return list.includes(v) ? v : undefined;
};

export const normaliseCustomerType = (value) => {
  if (typeof value !== 'string') return undefined;
  const v = value.trim().toUpperCase();
  return CUSTOMER_TYPES.includes(v) ? v : undefined;
};
