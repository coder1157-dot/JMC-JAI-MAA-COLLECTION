import api, { unwrap } from "./axios";

export const getCategories = () => unwrap(api.get("/categories"));
