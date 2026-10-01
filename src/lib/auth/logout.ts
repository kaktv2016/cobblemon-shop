type SignOutWithoutRedirect = (options: { redirect: false }) => Promise<unknown>;
type Navigate = (destination: string) => void;

/**
 * Clear the NextAuth session, then navigate relative to the browser's current
 * origin. This prevents a stale NEXTAUTH_URL (for example an expired Quick
 * Tunnel) from becoming the logout destination.
 */
export async function logoutOnCurrentOrigin(
  signOut: SignOutWithoutRedirect,
  navigate: Navigate,
  destination = "/login",
) {
  await signOut({ redirect: false });
  navigate(destination.startsWith("/") ? destination : "/login");
}
