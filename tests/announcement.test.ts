import { describe, expect, it } from "vitest";
import { createAnnouncementSchema, isValidAnnouncementDateRange } from "@/lib/validators/announcement";

describe("announcement validation", () => {
  it("normalizes blank dates to null", () => {
    const value = createAnnouncementSchema.parse({
      title: "Server update",
      content: "Ready",
      type: "INFO",
      startDate: "",
      endDate: "",
    });
    expect(value.startDate).toBeNull();
    expect(value.endDate).toBeNull();
  });

  it("rejects an end date before the start date", () => {
    expect(() => createAnnouncementSchema.parse({
      title: "Event",
      content: "Details",
      type: "EVENT",
      startDate: "2026-09-18T00:00:00.000Z",
      endDate: "2026-09-17T00:00:00.000Z",
    })).toThrow(/End date/);
    expect(isValidAnnouncementDateRange(new Date("2026-09-18"), new Date("2026-09-17"))).toBe(false);
  });
});
