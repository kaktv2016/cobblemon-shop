import "server-only";

import { cookies } from "next/headers";
import { parseAdminLocale, translateAdmin, type AdminTranslationKey } from "@/lib/admin-i18n";

export async function getAdminI18n() {
  const cookieStore = await cookies();
  const locale = parseAdminLocale(cookieStore.get("admin_locale")?.value);
  return {
    locale,
    t: (key: AdminTranslationKey, params?: Record<string, string | number>) =>
      translateAdmin(locale, key, params),
  };
}
