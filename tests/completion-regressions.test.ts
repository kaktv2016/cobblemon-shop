import { afterEach, describe, expect, it, vi } from "vitest";
import { CategoryFormSchema, CategoryReorderSchema } from "@/lib/admin/validation";
import { authmeHash, authmeVerify } from "@/lib/authme";
import { getPaymentProvider } from "@/lib/payment/provider";
import { translateAdminLegacyText } from "@/components/admin/admin-legacy-translator";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("completed catalog and account foundations", () => {
  it("validates real category edits and rejects duplicate reorder IDs", () => {
    expect(CategoryFormSchema.parse({ name: "Ranks", slug: "ranks", description: "", sortOrder: 1, isActive: true }).slug).toBe("ranks");
    expect(() => CategoryReorderSchema.parse({ orderedIds: ["one", "one"] })).toThrow(/duplicate/i);
  });

  it("creates AuthMe-compatible password hashes", () => {
    const hash = authmeHash("a-secure-password");
    expect(authmeVerify("a-secure-password", hash)).toBe(true);
    expect(authmeVerify("wrong-password", hash)).toBe(false);
  });
});

describe("payment provider retirement", () => {
  it.each(["omise", "xendit", "gbprimepay", "promptpay"])("prevents %s from creating new payments", (provider) => {
    vi.stubEnv("PAYMENT_PROVIDER", provider);
    expect(() => getPaymentProvider()).toThrow(/legacy-only/);
  });

  it("prevents sandbox payments in production", () => {
    vi.stubEnv("PAYMENT_PROVIDER", "sandbox");
    vi.stubEnv("NODE_ENV", "production");
    expect(() => getPaymentProvider()).toThrow(/disabled in production/);
  });
});

describe("admin legacy localization coverage", () => {
  it("translates CRUD, filters, and category ordering text", () => {
    expect(translateAdminLegacyText("View/Edit", "th")).toBe("ดู/แก้ไข");
    expect(translateAdminLegacyText("Sort Order", "th")).toBe("ลำดับการแสดง");
    expect(translateAdminLegacyText("Search products...", "th")).toBe("ค้นหาสินค้า...");
    expect(translateAdminLegacyText("หน้า 2 จาก 5", "en")).toBe("Page 2 of 5");
  });
});
