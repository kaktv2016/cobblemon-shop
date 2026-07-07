import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function requireAdminSession() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (!session.user.roles.includes("admin")) {
    redirect("/");
  }

  return session;
}

export async function getAdminSession() {
  const session = await getServerSession(authOptions);
  return session;
}

export async function requirePermission(permission: string) {
  const session = await requireAdminSession();
  // TODO: Implement permission checking against role permissions
  return session;
}
