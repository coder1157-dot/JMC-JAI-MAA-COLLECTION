import api, { unwrap } from "./axios";

export const getContactSettings = () => unwrap(api.get("/settings/contact"));
export const getHealth = () => unwrap(api.get("/health"));
