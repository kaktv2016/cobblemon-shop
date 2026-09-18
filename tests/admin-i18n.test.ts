import { describe, expect, it } from "vitest";
import {
  adminDictionaries,
  formatAdminCurrency,
  formatAdminDate,
  parseAdminLocale,
  parseAdminTheme,
  serializeAdminPreferenceCookie,
  translateAdmin,
} from "../src/lib/admin-i18n";

describe("admin preferences and translations", () => {
  it("keeps English and Thai dictionary keys in parity", () => {
    expect(Object.keys(adminDictionaries.th).sort()).toEqual(Object.keys(adminDictionaries.en).sort());
  });

  it("falls back to dark and English for invalid cookie values", () => {
    expect(parseAdminTheme("system")).toBe("dark");
    expect(parseAdminTheme("light")).toBe("light");
    expect(parseAdminLocale("ja")).toBe("en");
    expect(parseAdminLocale("th")).toBe("th");
  });

  it("persists preferences only for Admin routes", () => {
    expect(serializeAdminPreferenceCookie("admin_theme", "light")).toContain("path=/admin");
    expect(serializeAdminPreferenceCookie("admin_locale", "th")).toContain("max-age=31536000");
  });

  it("interpolates translated values", () => {
    expect(translateAdmin("th", "dashboard.failedJobs", { count: 3 })).toContain("3");
    expect(translateAdmin("en", "dashboard.items", { count: 2 })).toBe("2 items");
  });

  it("formats dates and THB for each locale", () => {
    const date = new Date("2026-09-18T00:00:00.000Z");
    expect(formatAdminDate(date, "en", { year: "numeric" })).toContain("2026");
    expect(formatAdminDate(date, "th", { year: "numeric" })).toContain("2569");
    expect(formatAdminCurrency(10, "en")).toContain("10");
    expect(formatAdminCurrency(10, "th")).toContain("10");
  });

  it("renders a safe fallback for missing or invalid dates", () => {
    expect(formatAdminDate(undefined, "en")).toBe("—");
    expect(formatAdminDate(null, "th")).toBe("—");
    expect(formatAdminDate("not-a-date", "en")).toBe("—");
  });
});
