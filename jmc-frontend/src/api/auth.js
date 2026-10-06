import api, { unwrap } from "./axios";

export const register = (payload) => unwrap(api.post("/auth/register", payload));
export const login = (payload) => unwrap(api.post("/auth/login", payload));
export const getMe = () => unwrap(api.get("/auth/me"));
export const updateProfile = (payload) => unwrap(api.put("/auth/profile", payload));

// Saved delivery addresses (max 10, one default). Orders keep their own snapshot of the address.
export const getAddresses = () => unwrap(api.get("/auth/addresses"));
export const addAddress = (payload) => unwrap(api.post("/auth/addresses", payload));
export const updateAddress = (id, payload) => unwrap(api.put(`/auth/addresses/${id}`, payload));
export const deleteAddress = (id) => unwrap(api.delete(`/auth/addresses/${id}`));
