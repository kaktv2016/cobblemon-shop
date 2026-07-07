import { requireAdminSession } from "@/lib/admin/auth";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/sidebar";
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

  return (
    <div className="bg-slate-950 min-h-screen">
      <AdminHeader
        userEmail={session.user.email}
        username={session.user.username}
      />
      <AdminSidebar />

      <main className="ml-64 pt-20 transition-all duration-300 md:ml-20 lg:ml-64">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
