const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

interface ApiErrorData {
  message?: string;
}

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

const buildUrl = (path: string): string => {
  if (/^https?:/i.test(path)) {
    return path;
  }
  if (!path.startsWith('/')) {
    return `${API_BASE_URL}/${path}`;
  }
  return `${API_BASE_URL}${path}`;
};

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    accept: 'application/json',
    ...(init.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl(path), {
    ...init,
    headers,
  });

  if (!response.ok) {
    let message = response.statusText || 'Request failed';
    try {
      const data = (await response.json()) as ApiErrorData;
      if (data?.message) {
        message = data.message;
      }
    } catch (error) {
      // ignore JSON parse errors for non-JSON responses
    }

    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
