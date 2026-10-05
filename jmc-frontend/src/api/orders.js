import api, { unwrap } from "./axios";

export const createOrder = (payload) => unwrap(api.post("/orders", payload));
export const getOrders = (params) => unwrap(api.get("/orders", { params }));
export const getOrder = (id) => unwrap(api.get(`/orders/${id}`));
