import { unstable_cache } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  buildPublicWikiArticleWhere,
  normalizeSearchQuery,
  WIKI_CACHE_TAG,
  WIKI_ROUTE_REVALIDATE,
} from "@/lib/wiki";

const wikiCategoryPreviewSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  coverImage: true,
  updatedAt: true,
  status: true,
} satisfies Prisma.WikiArticleSelect;

const publicWikiArticleCardSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  coverImage: true,
  isFeatured: true,
  status: true,
  gameVersion: true,
  lastReviewedAt: true,
  updatedAt: true,
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
      icon: true,
    },
  },
} satisfies Prisma.WikiArticleSelect;

export type PublicWikiArticleCard = Prisma.WikiArticleGetPayload<{
  select: typeof publicWikiArticleCardSelect;
}>;

const getPublicWikiIndexDataCached = unstable_cache(
  async (query: string) => {
    const normalizedQuery = normalizeSearchQuery(query);

    const [featuredArticles, recentArticles, recentUpdates, categories, counts] =
      await Promise.all([
        prisma.wikiArticle.findMany({
          where: buildPublicWikiArticleWhere(undefined, {
            isFeatured: true,
          }),
          select: publicWikiArticleCardSelect,
          orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
          take: 3,
        }),
        prisma.wikiArticle.findMany({
          where: buildPublicWikiArticleWhere(normalizedQuery),
          select: publicWikiArticleCardSelect,
          orderBy: normalizedQuery
            ? [{ isFeatured: "desc" }, { updatedAt: "desc" }]
            : [{ sortOrder: "asc" }, { updatedAt: "desc" }],
          take: normalizedQuery ? 12 : 6,
        }),
        prisma.wikiArticle.findMany({
          where: buildPublicWikiArticleWhere(),
          select: publicWikiArticleCardSelect,
          orderBy: [{ lastReviewedAt: "desc" }, { updatedAt: "desc" }],
          take: 4,
        }),
        prisma.wikiCategory.findMany({
          where: {
            isVisible: true,
          },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            icon: true,
            sortOrder: true,
            articles: {
              where: {
                isPublished: true,
              },
              orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { updatedAt: "desc" }],
              take: 1,
              select: wikiCategoryPreviewSelect,
            },
          },
        }),
        prisma.wikiArticle.groupBy({
          by: ["categoryId"],
          where: {
            isPublished: true,
          },
          _count: {
            _all: true,
          },
        }),
      ]);

    const articleCountMap = new Map(
      counts.map((entry) => [entry.categoryId, entry._count._all])
    );

    return {
      query: normalizedQuery,
      featuredArticles,
      recentArticles,
      recentUpdates,
      categories: categories.map((category) => ({
        ...category,
        articleCount: articleCountMap.get(category.id) ?? 0,
      })),
    };
  },
  ["public-wiki-index-data"],
  {
    revalidate: WIKI_ROUTE_REVALIDATE,
    tags: [WIKI_CACHE_TAG],
  }
);

const getPublicWikiCategoryDataCached = unstable_cache(
  async (slug: string, query: string) => {
    const normalizedQuery = normalizeSearchQuery(query);

    const category = await prisma.wikiCategory.findFirst({
      where: {
        slug,
        isVisible: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        icon: true,
        sortOrder: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!category) {
      return null;
    }

    const articles = await prisma.wikiArticle.findMany({
      where: buildPublicWikiArticleWhere(normalizedQuery, {
        categoryId: category.id,
      }),
      select: publicWikiArticleCardSelect,
      orderBy: normalizedQuery
        ? [{ isFeatured: "desc" }, { updatedAt: "desc" }]
        : [{ isFeatured: "desc" }, { sortOrder: "asc" }, { updatedAt: "desc" }],
      take: normalizedQuery ? 24 : 18,
    });

    return {
      query: normalizedQuery,
      category,
      articles,
    };
  },
  ["public-wiki-category-data"],
  {
    revalidate: WIKI_ROUTE_REVALIDATE,
    tags: [WIKI_CACHE_TAG],
  }
);

const getPublicWikiArticleDataCached = unstable_cache(
  async (slug: string) => {
    const article = await prisma.wikiArticle.findFirst({
      where: buildPublicWikiArticleWhere(undefined, { slug }),
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        coverImage: true,
        seoTitle: true,
        seoDescription: true,
        gameVersion: true,
        status: true,
        lastReviewedAt: true,
        createdAt: true,
        updatedAt: true,
        searchKeywords: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
            description: true,
          },
        },
      },
    });

    if (!article) {
      return null;
    }

    const relatedArticles = await prisma.wikiArticle.findMany({
      where: buildPublicWikiArticleWhere(undefined, {
        categoryId: article.category.id,
        id: {
          not: article.id,
        },
      }),
      select: publicWikiArticleCardSelect,
      orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { updatedAt: "desc" }],
      take: 3,
    });

    return {
      article,
      relatedArticles,
    };
  },
  ["public-wiki-article-data"],
  {
    revalidate: WIKI_ROUTE_REVALIDATE,
    tags: [WIKI_CACHE_TAG],
  }
);

const getAllPublicWikiArticleSlugsCached = unstable_cache(
  async () =>
    prisma.wikiArticle.findMany({
      where: {
        isPublished: true,
        category: {
          isVisible: true,
        },
      },
      select: {
        slug: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),
  ["public-wiki-article-slugs"],
  {
    revalidate: WIKI_ROUTE_REVALIDATE,
    tags: [WIKI_CACHE_TAG],
  }
);

const getAllPublicWikiCategorySlugsCached = unstable_cache(
  async () =>
    prisma.wikiCategory.findMany({
      where: {
        isVisible: true,
      },
      select: {
        slug: true,
      },
      orderBy: {
        sortOrder: "asc",
      },
    }),
  ["public-wiki-category-slugs"],
  {
    revalidate: WIKI_ROUTE_REVALIDATE,
    tags: [WIKI_CACHE_TAG],
  }
);

export async function getPublicWikiIndexData(query?: string) {
  return getPublicWikiIndexDataCached(normalizeSearchQuery(query));
}

export async function getPublicWikiCategoryData(slug: string, query?: string) {
  return getPublicWikiCategoryDataCached(slug, normalizeSearchQuery(query));
}

export async function getPublicWikiArticleData(slug: string) {
  return getPublicWikiArticleDataCached(slug);
}

export async function getAllPublicWikiArticleSlugs() {
  return getAllPublicWikiArticleSlugsCached();
}

export async function getAllPublicWikiCategorySlugs() {
  return getAllPublicWikiCategorySlugsCached();
}
