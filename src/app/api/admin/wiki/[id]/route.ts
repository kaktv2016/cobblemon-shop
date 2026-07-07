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

async function assertAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.roles.includes("admin")) {
    return null;
  }

  return session;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await assertAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const article = await prisma.wikiArticle.findUnique({
    where: { id },
  });

  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(article);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await assertAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.wikiArticle.findUnique({
    where: { id },
    include: {
      category: {
        select: {
          slug: true,
        },
      },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const json = await request.json();
    const data = WikiArticleFormSchema.parse(json);

    const article = await prisma.wikiArticle.update({
      where: { id },
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
        action: "WIKI_ARTICLE_UPDATE",
        target: "WIKI_ARTICLE",
        targetId: article.id,
        details: {
          previousSlug: existing.slug,
          nextSlug: article.slug,
          previousCategorySlug: existing.category.slug,
          nextCategorySlug: article.category.slug,
          status: article.status,
        },
      },
    });

    revalidateWikiAdminAndPublicPaths();
    revalidatePath(`/wiki/${existing.slug}`);
    revalidatePath(`/wiki/${article.slug}`);
    revalidatePath(`/wiki/category/${existing.category.slug}`);
    revalidatePath(`/wiki/category/${article.category.slug}`);

    return NextResponse.json(article);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "A wiki article with this slug already exists." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update wiki article." },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await assertAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.wikiArticle.findUnique({
    where: { id },
    include: {
      category: {
        select: {
          slug: true,
        },
      },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.wikiArticle.delete({
    where: { id },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      userEmail: session.user.email,
      action: "WIKI_ARTICLE_DELETE",
      target: "WIKI_ARTICLE",
      targetId: existing.id,
      details: {
        slug: existing.slug,
        categorySlug: existing.category.slug,
      },
    },
  });

  revalidateWikiAdminAndPublicPaths();
  revalidatePath(`/wiki/${existing.slug}`);
  revalidatePath(`/wiki/category/${existing.category.slug}`);

  return NextResponse.json({ success: true });
}
