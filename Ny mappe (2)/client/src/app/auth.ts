import { api } from "./api";
import { setTokens, setUser, getUser, getTokens } from "./storage";

export async function bootstrapMe(): Promise<any | null> {
  const tokens = getTokens();
  if (!tokens) return null;
  try {
    const me = await api.me();
    setUser(me);
    return me;
  } catch {
    api.logout();
    return null;
  }
}

export async function login(email: string, password: string) {
  const t = await api.login(email, password);
  setTokens(t);
  const me = await api.me();
  setUser(me);
  return me;
}

export function currentUser() {
  return getUser();
}
