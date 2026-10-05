import api, { unwrap } from "./axios";

export const getBanners = (position) =>
  unwrap(api.get("/banners", { params: position ? { position } : {} }));
