import { PLACEHOLDER_IMAGE } from "./constants";

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export const formatPrice = (n) => `₹${inr.format(Number(n) || 0)}`;

export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";

export const formatDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "";

export const statusLabel = (s = "") => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export const productImage = (product, index = 0) => product?.images?.[index]?.url || PLACEHOLDER_IMAGE;


export const isObjectId = (s) => /^[a-f\d]{24}$/i.test(s || "");

export const slugify = (s = "") =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export const stockLabel = (stock) => {
  if (stock <= 0) return { text: "Out of stock", tone: "out" };
  if (stock <= 3) return { text: `Only ${stock} left`, tone: "low" };
  return { text: "In stock", tone: "in" };
};
