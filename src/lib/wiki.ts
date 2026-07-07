import { Prisma, WikiArticleStatus } from "@prisma/client";

export const WIKI_CACHE_TAG = "wiki-content";
export const WIKI_ROUTE_REVALIDATE = 120;

export type WikiStatusMeta = {
  label: string;
  tone: string;
  description: string;
};

export type WikiCategoryTheme = {
  surface: string;
  glow: string;
  badge: string;
  accent: string;
};

const wikiStatusMeta: Record<WikiArticleStatus, WikiStatusMeta> = {
  DRAFT: {
    label: "Draft",
    tone: "border-white/10 bg-white/[0.04] text-slate-300",
    description: "Hidden from players until it is published.",
  },
  PUBLISHED: {
    label: "Published",
    tone: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
    description: "Visible to players in the public wiki.",
  },
  OUTDATED: {
    label: "Outdated",
    tone: "border-amber-400/20 bg-amber-400/10 text-amber-200",
    description: "Still visible, but marked for review.",
  },
};

const defaultWikiCategoryTheme: WikiCategoryTheme = {
  surface:
    "linear-gradient(135deg, rgba(12,18,42,0.96) 0%, rgba(11,28,50,0.9) 48%, rgba(9,14,28,0.96) 100%)",
  glow:
    "radial-gradient(circle at 12% 16%, rgba(56,189,248,0.2), transparent 34%), radial-gradient(circle at 88% 20%, rgba(129,140,248,0.18), transparent 28%)",
  badge:
    "border-cyan-300/18 bg-cyan-300/10 text-cyan-100",
  accent: "text-cyan-200",
};

const wikiCategoryThemes: Record<string, WikiCategoryTheme> = {
  "getting-started": {
    surface:
      "linear-gradient(135deg, rgba(9,20,47,0.98) 0%, rgba(10,36,60,0.9) 46%, rgba(7,11,28,0.96) 100%)",
    glow:
      "radial-gradient(circle at 14% 18%, rgba(56,189,248,0.22), transparent 36%), radial-gradient(circle at 86% 14%, rgba(96,165,250,0.18), transparent 28%)",
    badge: "border-sky-300/18 bg-sky-300/10 text-sky-100",
    accent: "text-sky-200",
  },
  progression: {
    surface:
      "linear-gradient(135deg, rgba(20,16,49,0.96) 0%, rgba(29,21,63,0.9) 52%, rgba(9,12,31,0.98) 100%)",
    glow:
      "radial-gradient(circle at 12% 20%, rgba(129,140,248,0.2), transparent 34%), radial-gradient(circle at 84% 18%, rgba(192,132,252,0.16), transparent 28%)",
    badge: "border-indigo-300/18 bg-indigo-300/10 text-indigo-100",
    accent: "text-indigo-200",
  },
  regions: {
    surface:
      "linear-gradient(135deg, rgba(9,31,37,0.94) 0%, rgba(12,47,56,0.9) 50%, rgba(7,14,28,0.96) 100%)",
    glow:
      "radial-gradient(circle at 16% 18%, rgba(45,212,191,0.18), transparent 34%), radial-gradient(circle at 84% 22%, rgba(56,189,248,0.16), transparent 28%)",
    badge: "border-teal-300/18 bg-teal-300/10 text-teal-100",
    accent: "text-teal-200",
  },
  gyms: {
    surface:
      "linear-gradient(135deg, rgba(27,21,49,0.96) 0%, rgba(49,28,62,0.92) 52%, rgba(13,13,29,0.98) 100%)",
    glow:
      "radial-gradient(circle at 16% 18%, rgba(244,114,182,0.18), transparent 34%), radial-gradient(circle at 84% 18%, rgba(129,140,248,0.18), transparent 26%)",
    badge: "border-fuchsia-300/18 bg-fuchsia-300/10 text-fuchsia-100",
    accent: "text-fuchsia-200",
  },
  raids: {
    surface:
      "linear-gradient(135deg, rgba(36,19,27,0.96) 0%, rgba(52,25,44,0.92) 50%, rgba(16,12,24,0.98) 100%)",
    glow:
      "radial-gradient(circle at 14% 18%, rgba(251,113,133,0.2), transparent 34%), radial-gradient(circle at 82% 16%, rgba(251,191,36,0.18), transparent 24%)",
    badge: "border-rose-300/18 bg-rose-300/10 text-rose-100",
    accent: "text-rose-200",
  },
  economy: {
    surface:
      "linear-gradient(135deg, rgba(38,27,12,0.96) 0%, rgba(59,45,18,0.92) 50%, rgba(17,13,24,0.98) 100%)",
    glow:
      "radial-gradient(circle at 14% 16%, rgba(250,204,21,0.18), transparent 34%), radial-gradient(circle at 82% 22%, rgba(251,146,60,0.14), transparent 28%)",
    badge: "border-amber-300/18 bg-amber-300/10 text-amber-100",
    accent: "text-amber-200",
  },
  commands: {
    surface:
      "linear-gradient(135deg, rgba(14,20,46,0.96) 0%, rgba(19,35,64,0.92) 50%, rgba(7,11,25,0.98) 100%)",
    glow:
      "radial-gradient(circle at 14% 16%, rgba(99,102,241,0.2), transparent 34%), radial-gradient(circle at 82% 16%, rgba(34,211,238,0.14), transparent 28%)",
    badge: "border-violet-300/18 bg-violet-300/10 text-violet-100",
    accent: "text-violet-200",
  },
  "server-rules": {
    surface:
      "linear-gradient(135deg, rgba(23,22,41,0.96) 0%, rgba(28,34,59,0.92) 50%, rgba(9,13,27,0.98) 100%)",
    glow:
      "radial-gradient(circle at 14% 18%, rgba(226,232,240,0.12), transparent 30%), radial-gradient(circle at 82% 20%, rgba(129,140,248,0.16), transparent 26%)",
    badge: "border-slate-300/18 bg-slate-300/10 text-slate-100",
    accent: "text-slate-200",
  },
  faq: {
    surface:
      "linear-gradient(135deg, rgba(16,22,44,0.96) 0%, rgba(20,30,58,0.92) 50%, rgba(8,12,28,0.98) 100%)",
    glow:
      "radial-gradient(circle at 12% 18%, rgba(59,130,246,0.18), transparent 34%), radial-gradient(circle at 86% 18%, rgba(34,211,238,0.16), transparent 28%)",
    badge: "border-cyan-300/18 bg-cyan-300/10 text-cyan-100",
    accent: "text-cyan-200",
  },
};

export function getWikiStatusMeta(status: WikiArticleStatus) {
  return wikiStatusMeta[status];
}

export function getWikiCategoryTheme(slug?: string | null) {
  if (!slug) {
    return defaultWikiCategoryTheme;
  }

  return wikiCategoryThemes[slug] ?? defaultWikiCategoryTheme;
}

export function normalizeSearchQuery(value?: string | null) {
  return value?.trim() ?? "";
}

export function parseSearchKeywords(value?: string | null) {
  return (value ?? "")
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);
}

export function normalizeSearchKeywords(value?: string | null) {
  return parseSearchKeywords(value).join(", ");
}

export function buildWikiSearchWhere(query?: string): Prisma.WikiArticleWhereInput {
  const normalizedQuery = normalizeSearchQuery(query);

  if (!normalizedQuery) {
    return {};
  }

  return {
    OR: [
      { title: { contains: normalizedQuery } },
      { slug: { contains: normalizedQuery } },
      { excerpt: { contains: normalizedQuery } },
      { searchKeywords: { contains: normalizedQuery } },
      { content: { contains: normalizedQuery } },
    ],
  };
}

export function buildPublicWikiArticleWhere(
  query?: string,
  extra: Prisma.WikiArticleWhereInput = {}
): Prisma.WikiArticleWhereInput {
  return {
    isPublished: true,
    category: {
      isVisible: true,
    },
    ...extra,
    ...buildWikiSearchWhere(query),
  };
}

export const defaultWikiCategorySeeds = [
  "Getting Started",
  "Progression",
  "Regions",
  "Gyms",
  "Raids",
  "Economy",
  "Commands",
  "Server Rules",
  "FAQ",
] as const;
