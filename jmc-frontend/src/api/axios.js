import axios from "axios";

export const TOKEN_KEY = "jmc_token";

// The ONLY place the API base URL is read.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

const read = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

// One JWT for everyone (customers and admins). The backend decides what each role may access.
api.interceptors.request.use((config) => {
  const token = read(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const FALLBACKS = {
  400: "Please check the details and try again.",
  401: "Please sign in to continue.",
  403: "You do not have permission to do that.",
  404: "We could not find what you were looking for.",
  409: "This conflicts with existing data.",
  429: "Too many requests. Please wait a moment and try again.",
  503: "This feature is not available right now.",
  500: "Something went wrong on our side. Please try again.",
};

// Normalise every failure to an Error carrying { message, status, errors }.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const res = error.response;
    const body = res?.data;
    const err = new Error(
      !res
        ? "Unable to connect to JMC server. Please try again."
        : body?.message || FALLBACKS[res.status] || FALLBACKS[500]
    );
    err.status = res?.status || 0;
    err.errors = Array.isArray(body?.errors) ? body.errors : [];
    err.isNetwork = !res;
    if (res?.status === 401) {
      const isLogin = /\/(auth|admin\/auth)\/login$/.test(error.config?.url || "");
      if (read(TOKEN_KEY) && !isLogin) window.dispatchEvent(new CustomEvent("jmc:unauthorized"));
    }
    return Promise.reject(err);
  }
);

/** Every API module returns the backend envelope: { success, data, message }. */
export const unwrap = async (promise) => {
  const res = await promise;
  const body = res.data;
  if (!body?.success) throw new Error(body?.message || "Request failed");
  return body;
};

export default api;
