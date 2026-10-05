import api, { unwrap } from "./axios";

export const getCart = () => unwrap(api.get("/cart"));
export const addToCart = (productId, quantity = 1) => unwrap(api.post("/cart", { productId, quantity }));
export const updateCartItem = (itemId, quantity) => unwrap(api.put(`/cart/${itemId}`, { quantity }));
export const removeCartItem = (itemId) => unwrap(api.delete(`/cart/${itemId}`));
export const clearCart = () => unwrap(api.delete("/cart"));
