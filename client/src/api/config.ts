// Development uses Vite's proxy so LAN/mobile clients never call their own localhost.
export const API_URL = import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_URL || '/api');
export const SOCKET_URL = import.meta.env.DEV ? window.location.origin :
  (import.meta.env.VITE_SOCKET_URL || new URL(API_URL, window.location.origin).origin);
