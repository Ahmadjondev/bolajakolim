const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8010/api';

interface TokenPair {
  access: string;
  refresh: string;
}

function getTokens(): TokenPair | null {
  const access = localStorage.getItem('access_token');
  const refresh = localStorage.getItem('refresh_token');
  if (!access || !refresh) return null;
  return { access, refresh };
}

function setTokens(access: string, refresh: string) {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
}

export function clearTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

async function refreshAccessToken(): Promise<string | null> {
  const tokens = getTokens();
  if (!tokens?.refresh) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: tokens.refresh }),
    });
    if (!res.ok) {
      clearTokens();
      return null;
    }
    const data = await res.json();
    setTokens(data.access, data.refresh);
    return data.access;
  } catch {
    clearTokens();
    return null;
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const tokens = getTokens();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };

  if (tokens?.access) {
    headers['Authorization'] = `Bearer ${tokens.access}`;
  }

  let res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  // If 401, try refreshing the token once
  if (res.status === 401 && tokens?.refresh) {
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      headers['Authorization'] = `Bearer ${newAccess}`;
      res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    }
  }

  if (res.status === 204) return undefined as T;

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body);
  }

  return res.json();
}

export class ApiError extends Error {
  status: number;
  body: Record<string, unknown>;

  constructor(status: number, body: Record<string, unknown>) {
    super(`API Error ${status}`);
    this.status = status;
    this.body = body;
  }
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
  full_name: string;
  created_at: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: AuthUser;
}

export async function apiRegister(data: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}): Promise<AuthResponse> {
  const res = await apiFetch<AuthResponse>('/auth/register/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  setTokens(res.access, res.refresh);
  return res;
}

export async function apiLogin(data: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await apiFetch<AuthResponse>('/auth/login/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  setTokens(res.access, res.refresh);
  return res;
}

export async function apiGoogleLogin(idToken: string): Promise<AuthResponse> {
  const res = await apiFetch<AuthResponse>('/auth/google/', {
    method: 'POST',
    body: JSON.stringify({ id_token: idToken }),
  });
  setTokens(res.access, res.refresh);
  return res;
}

export async function apiGetMe(): Promise<AuthUser> {
  return apiFetch<AuthUser>('/auth/me/');
}

// ─── Smetalar ────────────────────────────────────────────────────────────────

export interface SmetaListItem {
  id: number;
  project_name: string;
  organization_name: string;
  status: 'draft' | 'completed';
  created_at: string;
  updated_at: string;
  grand_total: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export async function apiListSmetalar(params?: {
  page?: number;
  search?: string;
  status?: string;
}): Promise<PaginatedResponse<SmetaListItem>> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.search) searchParams.set('search', params.search);
  if (params?.status) searchParams.set('status', params.status);
  const qs = searchParams.toString();
  return apiFetch<PaginatedResponse<SmetaListItem>>(`/smetalar/${qs ? `?${qs}` : ''}`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function apiCreateSmeta(data: Record<string, any>): Promise<any> {
  return apiFetch('/smetalar/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function apiUpdateSmeta(id: number, data: Record<string, any>): Promise<any> {
  return apiFetch(`/smetalar/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function apiGetSmeta(id: number): Promise<any> {
  return apiFetch(`/smetalar/${id}/`);
}

export async function apiDeleteSmeta(id: number): Promise<void> {
  return apiFetch(`/smetalar/${id}/`, { method: 'DELETE' });
}
