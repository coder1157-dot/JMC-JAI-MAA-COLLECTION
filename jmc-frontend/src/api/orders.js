import api, { unwrap } from "./axios";

export const createOrder = (payload) => unwrap(api.post("/orders", payload));
export const getOrders = (params) => unwrap(api.get("/orders", { params }));
export const getOrder = (id) => unwrap(api.get(`/orders/${id}`));

/** Server-side preview of items, shipping, discount and total (nothing is reserved). */
export const quoteOrder = (payload) => unwrap(api.post("/orders/quote", payload));
