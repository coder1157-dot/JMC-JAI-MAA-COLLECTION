import api, { unwrap } from "./axios";

export const createPaymentOrder = (orderId) => unwrap(api.post("/payments/create-order", { orderId }));
export const verifyPayment = (payload) => unwrap(api.post("/payments/verify", payload));
/** Records a failed / dismissed attempt (never overrides a paid order). */
export const reportPaymentFailure = (orderId) => unwrap(api.post("/payments/failed", { orderId }));
