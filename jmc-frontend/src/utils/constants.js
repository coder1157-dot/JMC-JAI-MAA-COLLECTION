// JMC runs in two customer modes on the same website:
//  - INDIAN         → enquiry-only catalogue (no prices, no cart, WhatsApp enquiry)
//  - INTERNATIONAL  → prices, cart, checkout (COD / Razorpay), order tracking
// The backend is the authority: it only returns prices / allows cart + orders for INTERNATIONAL accounts.
export const CUSTOMER_TYPES = { INDIAN: "INDIAN", INTERNATIONAL: "INTERNATIONAL" };

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "refund_initiated",
  "refunded",
];

// Happy-path delivery timeline shown in Track Order.
export const TRACK_STEPS = [
  { key: "pending", label: "Order Placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "processing", label: "Processing" },
  { key: "packed", label: "Packed" },
  { key: "shipped", label: "Shipped" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
];
export const EXCEPTION_STATUSES = ["cancelled", "refund_initiated", "refunded"];

// Destinations where Cash on Delivery is offered. The backend does not publish a COD list, so this is
// configurable: VITE_COD_COUNTRIES="India,United Arab Emirates" (default "*" = every destination).
const rawCod = import.meta.env.VITE_COD_COUNTRIES ?? "*";
export const COD_COUNTRIES = String(rawCod)
  .split(",")
  .map((c) => c.trim().toLowerCase())
  .filter(Boolean);
export const isCodAvailable = (country) =>
  COD_COUNTRIES.includes("*") || COD_COUNTRIES.includes(String(country || "").trim().toLowerCase());
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
