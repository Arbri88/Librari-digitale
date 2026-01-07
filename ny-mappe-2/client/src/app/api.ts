import { API_BASE_URL } from "./env";
import { getTokens, setTokens, setUser } from "./storage";

export class ApiError extends Error {
  status: number;
  details?: any;
  constructor(status: number, message: string, details?: any) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function rawFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(API_BASE_URL + path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new ApiError(res.status, data?.message || "Gabim.", data?.details);
  return data;
}

async function authFetch(path: string, init: RequestInit = {}) {
  const tokens = getTokens();
  const headers: any = { ...(init.headers || {}) };
  if (tokens?.accessToken) headers["Authorization"] = `Bearer ${tokens.accessToken}`;

  try {
    return await rawFetch(path, { ...init, headers });
  } catch (e: any) {
    // Try refresh once
    if (e instanceof ApiError && e.status === 401 && tokens?.refreshToken) {
      const refreshed = await rawFetch("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });
      setTokens({ accessToken: refreshed.accessToken, refreshToken: refreshed.refreshToken });
      headers["Authorization"] = `Bearer ${refreshed.accessToken}`;
      return await rawFetch(path, { ...init, headers });
    }
    throw e;
  }
}

export const api = {
  health: () => rawFetch("/health"),

  login: (email: string, password: string) => rawFetch("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (email: string, password: string, full_name: string) => rawFetch("/auth/register", { method: "POST", body: JSON.stringify({ email, password, full_name }) }),
  me: () => authFetch("/auth/me"),

  listBooks: (q: Record<string, any> = {}) => {
    const params = new URLSearchParams();
    Object.entries(q).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") params.set(k, String(v)); });
    return authFetch(`/books?${params.toString()}`);
  },
  searchBooks: (q: string, page=1, pageSize=12) => authFetch(`/books/search?${new URLSearchParams({ q, page: String(page), pageSize: String(pageSize) })}`),
  getBook: (id: string) => authFetch(`/books/${id}`),
  createBook: (body: any) => authFetch(`/books`, { method:"POST", body: JSON.stringify(body) }),
  updateBook: (id: string, body: any) => authFetch(`/books/${id}`, { method:"PUT", body: JSON.stringify(body) }),
  deleteBook: (id: string) => authFetch(`/books/${id}`, { method:"DELETE" }),

  listCategories: () => authFetch(`/categories`),
  createCategory: (body: any) => authFetch(`/categories`, { method:"POST", body: JSON.stringify(body) }),
  updateCategory: (id: string, body: any) => authFetch(`/categories/${id}`, { method:"PUT", body: JSON.stringify(body) }),
  deleteCategory: (id: string) => authFetch(`/categories/${id}`, { method:"DELETE" }),

  myLoans: (q: Record<string, any> = {}) => {
    const params = new URLSearchParams();
    Object.entries(q).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") params.set(k, String(v)); });
    return authFetch(`/loans?${params.toString()}`);
  },
  allLoans: (q: Record<string, any> = {}) => {
    const params = new URLSearchParams();
    Object.entries(q).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") params.set(k, String(v)); });
    return authFetch(`/loans/all?${params.toString()}`);
  },
  borrow: (book_id: string, notes?: string) => authFetch(`/loans`, { method:"POST", body: JSON.stringify({ book_id, notes }) }),
  returnLoan: (id: string) => authFetch(`/loans/${id}/return`, { method:"PUT" }),

  listUsers: (q: Record<string, any> = {}) => {
    const params = new URLSearchParams();
    Object.entries(q).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") params.set(k, String(v)); });
    return authFetch(`/users?${params.toString()}`);
  },
  updateUser: (id: string, body: any) => authFetch(`/users/${id}`, { method:"PUT", body: JSON.stringify(body) }),

  exportLoansCsv: (params: Record<string, any> = {}) => {
    const p = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") p.set(k, String(v)); });
    return API_BASE_URL + `/reports/loans.csv?${p.toString()}`;
  },
  exportBooksCsv: (params: Record<string, any> = {}) => {
    const p = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") p.set(k, String(v)); });
    return API_BASE_URL + `/reports/books.csv?${p.toString()}`;
  },

  logout: () => { setTokens(null); setUser(null); },
};
