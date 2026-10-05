import api, { unwrap } from "./axios";

export const createPaymentOrder = (orderId) => unwrap(api.post("/payments/create-order", { orderId }));
export const verifyPayment = (payload) => unwrap(api.post("/payments/verify", payload));
