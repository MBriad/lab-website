import { clearAuthToken } from "@/lib/api";

/** Anything that can perform a client-side replace (Next AppRouterInstance). */
export interface LoginRedirectRouter {
  replace: (href: string) => void;
}

/**
 * Clear the token and return the user to the login page after an auth
 * failure. The route change unmounts the current admin page, which resets
 * its client state.
 */
export function redirectToLogin(router: LoginRedirectRouter): void {
  clearAuthToken();
  router.replace("/admin/login");
}
