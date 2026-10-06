import api, { unwrap } from "./axios";

export const getContactSettings = () => unwrap(api.get("/settings/contact"));
export const getHealth = () => unwrap(api.get("/health"));
/** { base, available: [currency codes with a configured rate], razorpay: [currencies Razorpay can charge] } */
export const getCurrencies = () => unwrap(api.get("/settings/currencies"));
