import { requireAdminSession } from "@/lib/admin/auth";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminPreferencesProvider } from "@/components/admin/admin-preferences-provider";
import { parseAdminLocale, parseAdminTheme } from "@/lib/admin-i18n";
import { cookies } from "next/headers";
import { ToastProvider } from "@/components/ui/toast";
import type { ReactNode } from "react";

interface AdminLayoutProps {
  children: ReactNode;
}

export const metadata = {
  title: "Admin - Cobblemon Shop",
  description: "Admin dashboard for Cobblemon shop",
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await requireAdminSession();
  const cookieStore = await cookies();
  const initialLocale = parseAdminLocale(cookieStore.get("admin_locale")?.value);
  const initialTheme = parseAdminTheme(cookieStore.get("admin_theme")?.value);

  return (
    <AdminPreferencesProvider initialLocale={initialLocale} initialTheme={initialTheme}>
      <ToastProvider>
        <div className="min-h-screen bg-[var(--admin-canvas)] text-[var(--admin-text)] transition-colors duration-200">
          <AdminHeader
            userEmail={session.user.email}
            username={session.user.username}
          />
          <AdminSidebar />

          <main className="ml-64 pt-20 transition-all duration-300 md:ml-20 lg:ml-64">
            <div className="p-6">{children}</div>
          </main>
        </div>
      </ToastProvider>
    </AdminPreferencesProvider>
  );
}
