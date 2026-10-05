import api, { unwrap } from "./axios";

export const register = (payload) => unwrap(api.post("/auth/register", payload));
export const login = (payload) => unwrap(api.post("/auth/login", payload));
export const getMe = () => unwrap(api.get("/auth/me"));
export const updateProfile = (payload) => unwrap(api.put("/auth/profile", payload));
