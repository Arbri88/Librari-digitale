export type Tokens = { accessToken: string; refreshToken: string };

const KEY = "lms.tokens";
const USER_KEY = "lms.user";

export function getTokens(): Tokens | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as Tokens; } catch { return null; }
}
export function setTokens(t: Tokens | null) {
  if (!t) localStorage.removeItem(KEY);
  else localStorage.setItem(KEY, JSON.stringify(t));
}
export function getUser(): any | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
export function setUser(u: any | null) {
  if (!u) localStorage.removeItem(USER_KEY);
  else localStorage.setItem(USER_KEY, JSON.stringify(u));
}
