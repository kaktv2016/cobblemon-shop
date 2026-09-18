import { describe, expect, it } from "vitest";
import {
  adminLightTonePalette,
  adminTones,
  getAdminRoleTone,
  getAdminStatusTone,
} from "../src/lib/admin-ui";

function channel(value: number) {
  const normalized = value / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string) {
  const value = hex.replace("#", "");
  return (
    0.2126 * channel(Number.parseInt(value.slice(0, 2), 16)) +
    0.7152 * channel(Number.parseInt(value.slice(2, 4), 16)) +
    0.0722 * channel(Number.parseInt(value.slice(4, 6), 16))
  );
}

function contrastRatio(first: string, second: string) {
  const lighter = Math.max(luminance(first), luminance(second));
  const darker = Math.min(luminance(first), luminance(second));
  return (lighter + 0.05) / (darker + 0.05);
}

describe("admin semantic UI", () => {
  it("maps workflow statuses to stable semantic tones", () => {
    expect(getAdminStatusTone("DELIVERED")).toBe("success");
    expect(getAdminStatusTone("PENDING_PAYMENT")).toBe("warning");
    expect(getAdminStatusTone("PAID")).toBe("info");
    expect(getAdminStatusTone("QUEUED_DELIVERY")).toBe("accent");
    expect(getAdminStatusTone("FAILED_DELIVERY")).toBe("danger");
    expect(getAdminStatusTone("future_status")).toBe("neutral");
    expect(getAdminStatusTone(null)).toBe("neutral");
  });

  it("maps roles without leaking page-specific color classes", () => {
    expect(getAdminRoleTone("admin")).toBe("danger");
    expect(getAdminRoleTone("MODERATOR")).toBe("info");
    expect(getAdminRoleTone("user")).toBe("neutral");
    expect(getAdminRoleTone("custom-plugin-role")).toBe("neutral");
  });

  it.each(adminTones)("keeps %s badge text at WCAG AA contrast", (tone) => {
    const palette = adminLightTonePalette[tone];
    expect(contrastRatio(palette.text, palette.background)).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps the light primary button readable", () => {
    expect(contrastRatio("#ffffff", "#4f46e5")).toBeGreaterThanOrEqual(4.5);
  });
});
