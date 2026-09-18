"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminPreferences } from "@/components/admin/admin-preferences-provider";
import { cn } from "@/lib/utils";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useAdminPreferences();

  return (
    <div className="space-y-6">
      <nav className="flex gap-2 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-2">
        <Link className={cn("rounded-lg px-4 py-2 text-sm text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover)]", pathname.endsWith("/general") && "bg-indigo-600 text-white")} href="/admin/settings/general">
          {t("settings.general")}
        </Link>
        <Link className={cn("rounded-lg px-4 py-2 text-sm text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover)]", pathname.endsWith("/delivery") && "bg-indigo-600 text-white")} href="/admin/settings/delivery">
          {t("settings.delivery")}
        </Link>
      </nav>
      {children}
    </div>
  );
}
