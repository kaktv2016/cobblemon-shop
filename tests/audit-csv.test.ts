import { describe, expect, it } from "vitest";
import { convertAuditLogsToCSV } from "@/lib/services/audit.service";

describe("audit CSV", () => {
  it("handles null details and escapes commas, quotes, and newlines", () => {
    const csv = convertAuditLogsToCSV([
      {
        id: "1",
        userId: null,
        userEmail: "admin@example.com",
        action: "UPDATE\nMULTILINE",
        target: "PRODUCT",
        targetId: "p1",
        ipAddress: null,
        createdAt: new Date("2026-09-17T00:00:00.000Z"),
        details: null,
      },
      {
        id: "2",
        userId: "u1",
        userEmail: "quoted@example.com",
        action: "CREATE",
        target: "ANNOUNCEMENT",
        targetId: "a1",
        ipAddress: "127.0.0.1",
        createdAt: new Date("2026-09-17T01:00:00.000Z"),
        details: { message: "hello, \"world\"\nnext" },
      },
    ]);
    expect(csv).toContain("1,,admin@example.com");
    const details = JSON.stringify({ message: "hello, \"world\"\nnext" });
    expect(csv).toContain(`"${details.replace(/"/g, '""')}"`);
    expect(csv).toContain('"UPDATE\nMULTILINE"');
    expect(csv.split("\r\n")).toHaveLength(3);
  });
});
