"use client";

// Module-level guard: prevents multiple concurrent 401 redirects from racing
// and destroying a fresh session. Once a redirect is in-flight, all subsequent
// 401s are silently absorbed.
let _isRedirecting = false;

/**
 * Wrapper around fetch that handles authentication errors.
 * When a 401 response is received, redirects the user to login.
 * Redirecting to /auth/login (not /auth/logout) preserves any valid session
 * state and lets Auth0 handle silent re-auth via SSO when possible.
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const response = await fetch(url, options);

  if (response.status === 401) {
    if (!_isRedirecting) {
      _isRedirecting = true;
      window.location.href = "/auth/login";
    }
    // Never-resolving promise to halt downstream processing during redirect
    return new Promise<Response>(() => {});
  }

  return response;
}

/**
 * Wrapper around fetch that handles auth errors and parses JSON.
 * Throws on non-OK responses (except 401, which redirects).
 */
export async function fetchJsonWithAuth<T = unknown>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetchWithAuth(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorMessage = `Request failed: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // Response wasn't JSON
    }
    const error = new Error(errorMessage) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  return response.json() as Promise<T>;
}
