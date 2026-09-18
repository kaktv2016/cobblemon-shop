"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminLegacyTranslator } from "@/components/admin/admin-legacy-translator";
import {
  type AdminLocale,
  type AdminTheme,
  type AdminTranslationKey,
  formatAdminCurrency,
  formatAdminDate,
  formatAdminNumber,
  serializeAdminPreferenceCookie,
  translateAdmin,
} from "@/lib/admin-i18n";

interface AdminPreferencesContextValue {
  locale: AdminLocale;
  theme: AdminTheme;
  setLocale: (locale: AdminLocale) => void;
  setTheme: (theme: AdminTheme) => void;
  t: (key: AdminTranslationKey, params?: Record<string, string | number>) => string;
  formatDate: (value: Date | string | null | undefined, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (value: number) => string;
}

const AdminPreferencesContext = createContext<AdminPreferencesContextValue | null>(null);
export function AdminPreferencesProvider({
  children,
  initialLocale,
  initialTheme,
}: {
  children: React.ReactNode;
  initialLocale: AdminLocale;
  initialTheme: AdminTheme;
}) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [locale, updateLocale] = useState(initialLocale);
  const [theme, updateTheme] = useState(initialTheme);

  const setTheme = useCallback((nextTheme: AdminTheme) => {
    updateTheme(nextTheme);
    document.cookie = serializeAdminPreferenceCookie("admin_theme", nextTheme);
  }, []);

  const setLocale = useCallback((nextLocale: AdminLocale) => {
    updateLocale(nextLocale);
    document.cookie = serializeAdminPreferenceCookie("admin_locale", nextLocale);
    router.refresh();
  }, [router]);

  const value = useMemo<AdminPreferencesContextValue>(() => ({
    locale,
    theme,
    setLocale,
    setTheme,
    t: (key, params) => translateAdmin(locale, key, params),
    formatDate: (date, options) => formatAdminDate(date, locale, options),
    formatNumber: (number, options) => formatAdminNumber(number, locale, options),
    formatCurrency: (number) => formatAdminCurrency(number, locale),
  }), [locale, setLocale, setTheme, theme]);

  return (
    <AdminPreferencesContext.Provider value={value}>
      <div
        ref={rootRef}
        className="admin-theme min-h-screen"
        data-admin-locale={locale}
        data-admin-theme={theme}
        lang={locale}
      >
        {children}
        <AdminLegacyTranslator locale={locale} rootRef={rootRef} />
      </div>
    </AdminPreferencesContext.Provider>
  );
}

export function useAdminPreferences() {
  const context = useContext(AdminPreferencesContext);
  if (!context) throw new Error("useAdminPreferences must be used within AdminPreferencesProvider");
  return context;
}
