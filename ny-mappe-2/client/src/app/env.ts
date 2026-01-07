const envBaseUrl = import.meta.env.VITE_API_BASE_URL;
const isBrowser = typeof window !== "undefined";
const isLocalhost =
  isBrowser && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
const devFallback = "http://localhost:4000/api";
const prodFallback = isBrowser ? `${window.location.origin}/api` : devFallback;

export const API_BASE_URL = envBaseUrl || ((import.meta.env.DEV || isLocalhost) ? devFallback : prodFallback);
