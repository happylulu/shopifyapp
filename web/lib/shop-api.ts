import { useSessionToken } from "@/app/hooks/useSessionToken";

/**
 * Type-safe wrapper for making authenticated requests to the FastAPI backend.
 * Automatically includes the session token in the Authorization header.
 */
export async function shopFetch<T>(
  input: RequestInfo,
  init: RequestInit = {}
): Promise<T> {
  const getToken = useSessionToken();
  const token = await getToken();

  const response = await fetch(input, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Shop API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
