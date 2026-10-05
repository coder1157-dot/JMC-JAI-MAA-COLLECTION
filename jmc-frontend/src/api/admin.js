import axios from "axios";
import api, { unwrap } from "./axios";

const clean = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v != null));

// Auth
export const adminLogin = (payload) => unwrap(api.post("/admin/auth/login", payload));

// Analytics
export const getAnalytics = () => unwrap(api.get("/admin/analytics"));

// Products
export const adminGetProducts = (params) => unwrap(api.get("/admin/products", { params: clean(params) }));
export const adminGetProduct = (id) => unwrap(api.get(`/admin/products/${id}`));
export const adminCreateProduct = (body) => unwrap(api.post("/admin/products", body));
export const adminUpdateProduct = (id, body) => unwrap(api.put(`/admin/products/${id}`, body));
export const adminDeleteProduct = (id) => unwrap(api.delete(`/admin/products/${id}`));

// Inventory
export const adminGetInventory = (params) => unwrap(api.get("/admin/inventory", { params: clean(params) }));
export const adminSetStock = (id, stock) => unwrap(api.patch(`/admin/inventory/${id}`, { stock }));

// Categories
export const adminGetCategories = () => unwrap(api.get("/admin/categories"));
export const adminCreateCategory = (body) => unwrap(api.post("/admin/categories", body));
export const adminUpdateCategory = (id, body) => unwrap(api.put(`/admin/categories/${id}`, body));
export const adminDeleteCategory = (id) => unwrap(api.delete(`/admin/categories/${id}`));

// Orders
export const adminGetOrders = (params) => unwrap(api.get("/admin/orders", { params: clean(params) }));
export const adminGetOrder = (id) => unwrap(api.get(`/admin/orders/${id}`));
export const adminUpdateOrderStatus = (id, body) => unwrap(api.patch(`/admin/orders/${id}/status`, body));

// Users
export const adminGetUsers = (params) => unwrap(api.get("/admin/users", { params: clean(params) }));
export const adminSetUserStatus = (id, active) => unwrap(api.patch(`/admin/users/${id}/status`, { active }));

// Banners
export const adminGetBanners = () => unwrap(api.get("/admin/banners"));
export const adminCreateBanner = (body) => unwrap(api.post("/admin/banners", body));
export const adminUpdateBanner = (id, body) => unwrap(api.put(`/admin/banners/${id}`, body));
export const adminDeleteBanner = (id) => unwrap(api.delete(`/admin/banners/${id}`));

// Coupons
export const adminGetCoupons = () => unwrap(api.get("/admin/coupons"));
export const adminCreateCoupon = (body) => unwrap(api.post("/admin/coupons", body));
export const adminUpdateCoupon = (id, body) => unwrap(api.put(`/admin/coupons/${id}`, body));
export const adminDeleteCoupon = (id) => unwrap(api.delete(`/admin/coupons/${id}`));

// Cloudinary signed upload (secret never reaches the browser; only a signature does)
export const getUploadSignature = (folder = "jmc/products") =>
  unwrap(api.post("/admin/uploads/signature", { folder }));

/** Signed direct upload to Cloudinary. Returns { url, publicId, alt }. */
export const uploadImage = async (file, folder = "jmc/products") => {
  const { data: sig } = await getUploadSignature(folder);
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.apiKey);
  form.append("timestamp", sig.timestamp);
  form.append("folder", sig.folder);
  form.append("signature", sig.signature);
  try {
    // Plain axios on purpose: Cloudinary is a third-party host and must not receive our JWT.
    const res = await axios.post(sig.uploadUrl, form);
    return { url: res.data.secure_url, publicId: res.data.public_id, alt: "" };
  } catch (e) {
    throw new Error(e.response?.data?.error?.message || "Image upload failed. Please try again.");
  }
};
