export const adminTones = ["neutral", "info", "success", "warning", "danger", "accent"] as const;

export type AdminTone = (typeof adminTones)[number];

const SUCCESS_STATUSES = new Set(["ACTIVE", "ENABLED", "DELIVERED", "SUCCESS", "COMPLETED", "PUBLISHED"]);
const WARNING_STATUSES = new Set(["PENDING", "PENDING_PAYMENT", "PARTIALLY_DELIVERED", "DEPLETED"]);
const INFO_STATUSES = new Set(["PAID", "PROCESSING", "PUBLIC", "INFO"]);
const ACCENT_STATUSES = new Set(["QUEUED", "QUEUED_DELIVERY", "EVENT", "SALE"]);
const DANGER_STATUSES = new Set([
  "FAILED",
  "FAILED_DELIVERY",
  "CANCELLED",
  "CANCELED",
  "EXPIRED",
  "DELETE",
  "MAINTENANCE",
]);

export function getAdminStatusTone(status: string | null | undefined): AdminTone {
  const normalized = status?.trim().toUpperCase() ?? "";
  if (SUCCESS_STATUSES.has(normalized)) return "success";
  if (WARNING_STATUSES.has(normalized)) return "warning";
  if (INFO_STATUSES.has(normalized)) return "info";
  if (ACCENT_STATUSES.has(normalized)) return "accent";
  if (DANGER_STATUSES.has(normalized)) return "danger";
  return "neutral";
}

export function getAdminRoleTone(role: string | null | undefined): AdminTone {
  switch (role?.trim().toLowerCase()) {
    case "admin":
      return "danger";
    case "moderator":
      return "info";
    default:
      return "neutral";
  }
}

export const adminLightTonePalette: Record<AdminTone, { background: string; border: string; text: string }> = {
  neutral: { background: "#f1f5f9", border: "#cbd5e1", text: "#475569" },
  info: { background: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" },
  success: { background: "#ecfdf5", border: "#a7f3d0", text: "#047857" },
  warning: { background: "#fffbeb", border: "#fde68a", text: "#92400e" },
  danger: { background: "#fff1f2", border: "#fecdd3", text: "#be123c" },
  accent: { background: "#f5f3ff", border: "#ddd6fe", text: "#6d28d9" },
};
