import { z } from "zod";

const optionalDate = z.preprocess(
  (value) => value === "" ? null : value,
  z.coerce.date().optional().nullable()
);

export function isValidAnnouncementDateRange(
  startDate: Date | null | undefined,
  endDate: Date | null | undefined
) {
  return !startDate || !endDate || endDate >= startDate;
}

const announcementFields = {
  title: z.string().trim().min(1).max(256),
  content: z.string().trim().min(1).max(5000),
  type: z.enum(["INFO", "WARNING", "SALE", "EVENT", "MAINTENANCE"]),
  isActive: z.boolean(),
  startDate: optionalDate,
  endDate: optionalDate,
  sortOrder: z.number().int(),
};

export const createAnnouncementSchema = z.object({
  ...announcementFields,
  isActive: announcementFields.isActive.default(true),
  sortOrder: announcementFields.sortOrder.default(0),
}).refine((value) => isValidAnnouncementDateRange(value.startDate, value.endDate), {
  message: "End date must be after start date",
  path: ["endDate"],
});

export const updateAnnouncementSchema = z.object({
  title: announcementFields.title.optional(),
  content: announcementFields.content.optional(),
  type: announcementFields.type.optional(),
  isActive: announcementFields.isActive.optional(),
  startDate: announcementFields.startDate,
  endDate: announcementFields.endDate,
  sortOrder: announcementFields.sortOrder.optional(),
});
