const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

type Options = RequestInit & { authToken?: string };

export async function apiFetch<T>(path: string, options: Options = {}): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (options.authToken) {
    headers["Authorization"] = `Bearer ${options.authToken}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Request failed");
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export { API_URL };
