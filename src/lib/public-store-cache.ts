import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export const PUBLIC_ROUTE_REVALIDATE = 60;

const getPublicHomeDataCached = unstable_cache(
  async () => {
    const [featured, categories] = await Promise.all([
      prisma.product.findMany({
        where: { isFeatured: true, isActive: true, visibility: "PUBLIC" },
        include: { category: { select: { name: true, slug: true } } },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        take: 4,
      }),
      prisma.category.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: {
              products: {
                where: { isActive: true, visibility: "PUBLIC" },
              },
            },
          },
        },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

    return { featured, categories };
  },
  ["public-home-data"],
  { revalidate: PUBLIC_ROUTE_REVALIDATE }
);

const getPublicStoreOverviewDataCached = unstable_cache(
  async () => {
    const [categories, featured] = await Promise.all([
      prisma.category.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          imageUrl: true,
          _count: {
            select: {
              products: {
                where: { isActive: true, visibility: "PUBLIC" },
              },
            },
          },
          products: {
            where: { isActive: true, visibility: "PUBLIC" },
            take: 3,
            orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
            select: {
              id: true,
              name: true,
              slug: true,
              shortDescription: true,
              price: true,
              compareAtPrice: true,
              imageUrl: true,
              bannerUrl: true,
              productType: true,
              stockLimit: true,
              stockSold: true,
              purchaseLimit: true,
              cooldownMinutes: true,
            },
          },
        },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.product.findMany({
        where: { isFeatured: true, isActive: true, visibility: "PUBLIC" },
        take: 4,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        select: {
          id: true,
          name: true,
          slug: true,
          shortDescription: true,
          price: true,
          compareAtPrice: true,
          imageUrl: true,
          bannerUrl: true,
          productType: true,
          stockLimit: true,
          stockSold: true,
          purchaseLimit: true,
          cooldownMinutes: true,
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      }),
    ]);

    return {
      categories: categories.filter((category) => category.products.length > 0),
      featured,
    };
  },
  ["public-store-overview-data"],
  { revalidate: PUBLIC_ROUTE_REVALIDATE }
);

const getPublicNewsAnnouncementsCached = unstable_cache(
  async () =>
    prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    }),
  ["public-news-announcements"],
  { revalidate: PUBLIC_ROUTE_REVALIDATE }
);

const getPublicCategoryPageDataCached = unstable_cache(
  async (slug: string) => {
    const category = await prisma.category.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        imageUrl: true,
        isActive: true,
      },
    });

    if (!category || !category.isActive) {
      return null;
    }

    const products = await prisma.product.findMany({
      where: {
        categoryId: category.id,
        isActive: true,
        visibility: "PUBLIC",
      },
      select: {
        id: true,
        name: true,
        slug: true,
        shortDescription: true,
        price: true,
        compareAtPrice: true,
        productType: true,
        stockLimit: true,
        stockSold: true,
        imageUrl: true,
        bannerUrl: true,
        purchaseLimit: true,
        cooldownMinutes: true,
      },
      orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    });

    return { category, products };
  },
  ["public-category-page-data"],
  { revalidate: PUBLIC_ROUTE_REVALIDATE }
);

const getPublicProductPageDataCached = unstable_cache(
  async (slug: string) => {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        tags: {
          select: {
            tag: true,
          },
        },
        bundleItems: {
          include: {
            item: {
              select: {
                id: true,
                name: true,
                price: true,
                shortDescription: true,
                imageUrl: true,
                bannerUrl: true,
                slug: true,
                productType: true,
                purchaseLimit: true,
                cooldownMinutes: true,
                stockLimit: true,
                stockSold: true,
                category: {
                  select: {
                    name: true,
                    slug: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!product || !product.isActive || product.visibility !== "PUBLIC") {
      return null;
    }

    const relatedProducts = await prisma.product.findMany({
      where: {
        categoryId: product.category.id,
        id: { not: product.id },
        isActive: true,
        visibility: "PUBLIC",
      },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        compareAtPrice: true,
        shortDescription: true,
        productType: true,
        imageUrl: true,
        bannerUrl: true,
        purchaseLimit: true,
        cooldownMinutes: true,
        stockLimit: true,
        stockSold: true,
        category: {
          select: {
            slug: true,
            name: true,
          },
        },
      },
      take: 3,
      orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    });

    return { product, relatedProducts };
  },
  ["public-product-page-data"],
  { revalidate: PUBLIC_ROUTE_REVALIDATE }
);

export async function getPublicHomeData() {
  return getPublicHomeDataCached();
}

export async function getPublicStoreOverviewData() {
  return getPublicStoreOverviewDataCached();
}

export async function getPublicNewsAnnouncements() {
  return getPublicNewsAnnouncementsCached();
}

export async function getPublicCategoryPageData(slug: string) {
  return getPublicCategoryPageDataCached(slug);
}

export async function getPublicProductPageData(slug: string) {
  return getPublicProductPageDataCached(slug);
}
