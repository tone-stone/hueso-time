/** True when the current route should stay open for OAuth redirect completion. */
export function isOAuthRedirectRoute(segment: string | undefined): boolean {
  return segment === 'oauth';
}
