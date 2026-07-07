import { prisma } from "@/lib/prisma";
import { AnnouncementType, HomepageSectionType, Prisma } from "@prisma/client";
import { z } from "zod";

const createAnnouncementSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  type: z.enum(["INFO", "WARNING", "SALE", "EVENT", "MAINTENANCE"]).default("INFO"),
  isActive: z.boolean().default(true),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
});

const updateAnnouncementSchema = createAnnouncementSchema.partial();

const createHomepageSectionSchema = z.object({
  title: z.string().min(1).max(255),
  subtitle: z.string().max(500).optional().nullable(),
  type: z.enum(["HERO", "FEATURED", "CATEGORY", "BANNER", "TEXT", "PRODUCTS"]),
  content: z.record(z.any()).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  linkUrl: z.string().optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

const updateHomepageSectionSchema = createHomepageSectionSchema.partial();

const createSupportArticleSchema = z.object({
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  content: z.string().min(1),
  category: z.string().min(1).max(100).default("General"),
  isPublished: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
});

const updateSupportArticleSchema = createSupportArticleSchema.partial();

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;
export type CreateHomepageSectionInput = z.infer<typeof createHomepageSectionSchema>;
export type UpdateHomepageSectionInput = z.infer<typeof updateHomepageSectionSchema>;
export type CreateSupportArticleInput = z.infer<typeof createSupportArticleSchema>;
export type UpdateSupportArticleInput = z.infer<typeof updateSupportArticleSchema>;

export class ContentService {
  // ──────────── Announcements ────────────

  static async getAnnouncements(activeOnly: boolean = true) {
    const now = new Date();
    const where = activeOnly
      ? {
          isActive: true,
          AND: [
            { OR: [{ startDate: null }, { startDate: { lte: now } }] },
            { OR: [{ endDate: null }, { endDate: { gte: now } }] },
          ],
        }
      : {};

    return prisma.announcement.findMany({
      where,
      orderBy: { sortOrder: "asc" as const },
    });
  }

  static async createAnnouncement(data: CreateAnnouncementInput) {
    const v = createAnnouncementSchema.parse(data);
    return prisma.announcement.create({
      data: {
        title: v.title,
        content: v.content,
        type: v.type as AnnouncementType,
        isActive: v.isActive,
        startDate: v.startDate ?? null,
        endDate: v.endDate ?? null,
        sortOrder: v.sortOrder,
      },
    });
  }

  static async updateAnnouncement(id: string, data: UpdateAnnouncementInput) {
    const v = updateAnnouncementSchema.parse(data);
    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) throw new Error(`Announcement "${id}" not found`);

    return prisma.announcement.update({
      where: { id },
      data: {
        ...(v.title !== undefined && { title: v.title }),
        ...(v.content !== undefined && { content: v.content }),
        ...(v.type !== undefined && { type: v.type as AnnouncementType }),
        ...(v.isActive !== undefined && { isActive: v.isActive }),
        ...(v.startDate !== undefined && { startDate: v.startDate }),
        ...(v.endDate !== undefined && { endDate: v.endDate }),
        ...(v.sortOrder !== undefined && { sortOrder: v.sortOrder }),
      },
    });
  }

  static async deleteAnnouncement(id: string) {
    return prisma.announcement.delete({ where: { id } });
  }

  // ──────────── Homepage Sections ────────────

  static async getHomepageSections(activeOnly: boolean = true) {
    return prisma.homepageSection.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: { sortOrder: "asc" },
    });
  }

  static async createHomepageSection(data: CreateHomepageSectionInput) {
    const v = createHomepageSectionSchema.parse(data);
    return prisma.homepageSection.create({
      data: {
        title: v.title,
        subtitle: v.subtitle ?? null,
        type: v.type as HomepageSectionType,
        content: v.content ?? undefined,
        imageUrl: v.imageUrl ?? null,
        linkUrl: v.linkUrl ?? null,
        sortOrder: v.sortOrder,
        isActive: v.isActive,
      },
    });
  }

  static async updateHomepageSection(id: string, data: UpdateHomepageSectionInput) {
    const v = updateHomepageSectionSchema.parse(data);
    const existing = await prisma.homepageSection.findUnique({ where: { id } });
    if (!existing) throw new Error(`Section "${id}" not found`);

    return prisma.homepageSection.update({
      where: { id },
      data: {
        ...(v.title !== undefined && { title: v.title }),
        ...(v.subtitle !== undefined && { subtitle: v.subtitle }),
        ...(v.type !== undefined && { type: v.type as HomepageSectionType }),
        ...(v.content !== undefined && { content: v.content ? (v.content as Prisma.InputJsonValue) : Prisma.JsonNull }),
        ...(v.imageUrl !== undefined && { imageUrl: v.imageUrl }),
        ...(v.linkUrl !== undefined && { linkUrl: v.linkUrl }),
        ...(v.sortOrder !== undefined && { sortOrder: v.sortOrder }),
        ...(v.isActive !== undefined && { isActive: v.isActive }),
      },
    });
  }

  static async reorderHomepageSections(ids: string[]) {
    const sections = await prisma.homepageSection.findMany({
      where: { id: { in: ids } },
    });
    if (sections.length !== ids.length) throw new Error("Invalid section IDs");

    return Promise.all(
      ids.map((id, index) =>
        prisma.homepageSection.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    );
  }

  // ──────────── Support Articles ────────────

  static async getSupportArticles(published: boolean = true) {
    return prisma.supportArticle.findMany({
      where: published ? { isPublished: true } : {},
      orderBy: { sortOrder: "asc" },
    });
  }

  static async getSupportArticleBySlug(slug: string) {
    return prisma.supportArticle.findUnique({ where: { slug } });
  }

  static async getSupportArticleById(id: string) {
    return prisma.supportArticle.findUnique({ where: { id } });
  }

  static async createSupportArticle(data: CreateSupportArticleInput) {
    const v = createSupportArticleSchema.parse(data);
    const existing = await prisma.supportArticle.findUnique({ where: { slug: v.slug } });
    if (existing) throw new Error(`Article slug "${v.slug}" already exists`);

    return prisma.supportArticle.create({
      data: {
        title: v.title,
        slug: v.slug,
        content: v.content,
        category: v.category,
        isPublished: v.isPublished,
        sortOrder: v.sortOrder,
      },
    });
  }

  static async updateSupportArticle(id: string, data: UpdateSupportArticleInput) {
    const v = updateSupportArticleSchema.parse(data);
    const article = await prisma.supportArticle.findUnique({ where: { id } });
    if (!article) throw new Error(`Article "${id}" not found`);

    if (v.slug && v.slug !== article.slug) {
      const dup = await prisma.supportArticle.findUnique({ where: { slug: v.slug } });
      if (dup) throw new Error(`Slug "${v.slug}" taken`);
    }

    return prisma.supportArticle.update({
      where: { id },
      data: {
        ...(v.title !== undefined && { title: v.title }),
        ...(v.slug !== undefined && { slug: v.slug }),
        ...(v.content !== undefined && { content: v.content }),
        ...(v.category !== undefined && { category: v.category }),
        ...(v.isPublished !== undefined && { isPublished: v.isPublished }),
        ...(v.sortOrder !== undefined && { sortOrder: v.sortOrder }),
      },
    });
  }

  static async deleteSupportArticle(id: string) {
    return prisma.supportArticle.delete({ where: { id } });
  }
}
