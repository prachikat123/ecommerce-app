const TOKEN_KEY = "kb_token";

export interface ApiErrorShape {
  message: string;
  code: string;
  details?: Array<{ path: string; message: string }>;
}

export class ApiClientError extends Error implements ApiErrorShape {
  code: string;
  details?: Array<{ path: string; message: string }>;
  status: number;

  constructor(status: number, shape: ApiErrorShape) {
    super(shape.message);
    this.status = status;
    this.code = shape.code;
    this.details = shape.details;
  }
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore storage failures (private mode) */
  }
}

/**
 * Base URL for API calls.
 *
 * In development this stays a relative "/api" and is forwarded to the Express
 * server by the Vite proxy. In production there is no proxy, so set
 * VITE_API_URL (e.g. "https://krishibazaar-api.onrender.com/api") at build time.
 */
function resolveBase(value: string | undefined): string {
  const raw = (value ?? "").trim();
  if (!raw) return "/api";
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

const BASE = resolveBase(import.meta.env.VITE_API_URL);

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true } = options;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch {
    throw new ApiClientError(0, {
      message: `Cannot reach the server at ${BASE}. Is the API running?`,
      code: "NETWORK"
    });
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const shape: ApiErrorShape = data?.error ?? {
      message: `Request failed (${response.status})`,
      code: "ERROR"
    };
    throw new ApiClientError(response.status, shape);
  }

  return data as T;
}

export function queryString(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "" || value === false) continue;
    search.set(key, String(value));
  }
  const s = search.toString();
  return s ? `?${s}` : "";
}
