import api, { unwrap } from "./axios";

const clean = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v != null));

export const getProducts = (params) => unwrap(api.get("/products", { params: clean(params) }));
export const getNewArrivals = (params) => unwrap(api.get("/products/new-arrivals", { params: clean(params) }));
export const getFeatured = (params) => unwrap(api.get("/products/featured", { params: clean(params) }));
export const getProductById = (id) => unwrap(api.get(`/products/${id}`));
export const getProductBySlug = (slug) => unwrap(api.get(`/products/slug/${encodeURIComponent(slug)}`));
