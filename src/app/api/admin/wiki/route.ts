import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WIKI_CACHE_TAG } from "@/lib/wiki";
import { WikiArticleFormSchema } from "@/lib/admin/validation";

function buildWikiArticlePayload(data: ReturnType<typeof WikiArticleFormSchema.parse>) {
  return {
    title: data.title,
    slug: data.slug,
    excerpt: data.excerpt,
    content: data.content,
    coverImage: data.coverImage || null,
    categoryId: data.categoryId,
    isFeatured: data.isFeatured,
    status: data.status,
    isPublished: data.status !== "DRAFT",
    sortOrder: data.sortOrder ?? 0,
    seoTitle: data.seoTitle || null,
    seoDescription: data.seoDescription || null,
    gameVersion: data.gameVersion || null,
    lastReviewedAt: data.lastReviewedAt ? new Date(data.lastReviewedAt) : null,
    searchKeywords: data.searchKeywords || null,
  };
}

function revalidateWikiAdminAndPublicPaths() {
  revalidateTag(WIKI_CACHE_TAG);
  revalidatePath("/wiki");
  revalidatePath("/admin/content");
  revalidatePath("/admin/content/wiki");
  revalidatePath("/admin/content/wiki/categories");
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.roles.includes("admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const articles = await prisma.wikiArticle.findMany({
    orderBy: [{ updatedAt: "desc" }],
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  return NextResponse.json(articles);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.roles.includes("admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const data = WikiArticleFormSchema.parse(json);

    const article = await prisma.wikiArticle.create({
      data: buildWikiArticlePayload(data),
      include: {
        category: {
          select: {
            slug: true,
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: "WIKI_ARTICLE_CREATE",
        target: "WIKI_ARTICLE",
        targetId: article.id,
        details: {
          slug: article.slug,
          categoryId: article.categoryId,
          status: article.status,
        },
      },
    });

    revalidateWikiAdminAndPublicPaths();
    revalidatePath(`/wiki/${article.slug}`);
    revalidatePath(`/wiki/category/${article.category.slug}`);

    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "A wiki article with this slug already exists." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create wiki article." },
      { status: 400 }
    );
  }
}
