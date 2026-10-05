// JMC is an enquiry-based catalogue: product prices are private and never shown publicly.
// Cart and checkout depend on prices, so they are switched off for customers.
// Set to true to bring the cart/checkout flow back (it will then show prices again).
export const CART_ENABLED = false;

// Display-only estimate. The backend computes the real order total and is the final authority.
export const DELIVERY_FEE_THRESHOLD = 1000;
export const DELIVERY_FEE_ESTIMATE = 200;

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "refunded",
];
export const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"];

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "name_asc", label: "Name: A to Z" },
  { value: "name_desc", label: "Name: Z to A" },
];

export const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'><rect width='400' height='400' fill='#F3EBDD'/><text x='200' y='215' text-anchor='middle' font-family='Georgia,serif' font-size='54' fill='#C9A96E'>JMC</text></svg>`
  );
