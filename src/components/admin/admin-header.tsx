"use client";

import { signOut } from "next-auth/react";
import { Bell, Languages, LogOut, Moon, Sun, User } from "lucide-react";
import { useState } from "react";
import { useAdminPreferences } from "@/components/admin/admin-preferences-provider";

interface AdminHeaderProps {
  userEmail: string;
  username: string;
}

export function AdminHeader({ userEmail, username }: AdminHeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { locale, setLocale, theme, setTheme, t } = useAdminPreferences();

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-[var(--admin-border)] bg-[var(--admin-header)] px-6 py-3.5 text-[var(--admin-text)] shadow-[0_1px_3px_rgba(15,23,42,0.06)] backdrop-blur-xl transition-colors duration-200">
      <div className="flex items-center justify-between">
        {/* Logo/Brand */}
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-sm shadow-indigo-500/20">
            <span className="text-sm font-bold text-white">CB</span>
          </div>
          <div className="text-lg font-semibold text-[var(--admin-text)]">{t("brand.admin")}</div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-xl border border-transparent p-2 text-[var(--admin-text-muted)] transition-colors hover:border-[var(--admin-border)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-focus)]"
            aria-label={theme === "dark" ? t("header.lightTheme") : t("header.darkTheme")}
            title={theme === "dark" ? t("header.lightTheme") : t("header.darkTheme")}
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <button
            type="button"
            onClick={() => setLocale(locale === "en" ? "th" : "en")}
            className="flex items-center gap-1.5 rounded-xl border border-transparent px-2.5 py-2 text-sm font-semibold text-[var(--admin-text-muted)] transition-colors hover:border-[var(--admin-border)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-focus)]"
            aria-label={t("header.language")}
            title={t("header.language")}
          >
            <Languages className="h-5 w-5" />
            <span>{locale === "en" ? "EN" : "TH"}</span>
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative rounded-xl border border-transparent p-2 text-[var(--admin-text-muted)] transition-colors hover:border-[var(--admin-border)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-focus)]"
              aria-label={t("header.notifications")}
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-red-500" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-elevated)] shadow-lg">
                <div className="p-4">
                  <h3 className="font-semibold text-[var(--admin-text)]">{t("header.notifications")}</h3>
                  <p className="mt-4 text-sm text-[var(--admin-text-muted)]">{t("header.noNotifications")}</p>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 rounded-xl border border-transparent px-3 py-2 text-sm font-medium text-[var(--admin-text-muted)] transition-colors hover:border-[var(--admin-border)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-focus)]"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline" data-admin-user-content>{username}</span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-elevated)] shadow-lg">
                <div className="border-b border-[var(--admin-border)] p-4">
                  <p className="text-sm font-semibold text-[var(--admin-text)]" data-admin-user-content>{username}</p>
                  <p className="text-xs text-[var(--admin-text-muted)]" data-admin-user-content>{userEmail}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-3 text-sm text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]"
                >
                  <LogOut className="h-4 w-4" />
                  {t("header.logout")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
