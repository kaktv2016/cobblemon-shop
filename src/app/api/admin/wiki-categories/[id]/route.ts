import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WIKI_CACHE_TAG } from "@/lib/wiki";
import { WikiCategoryFormSchema } from "@/lib/admin/validation";

function buildWikiCategoryPayload(data: ReturnType<typeof WikiCategoryFormSchema.parse>) {
  return {
    name: data.name,
    slug: data.slug,
    description: data.description || null,
    icon: data.icon || null,
    sortOrder: data.sortOrder ?? 0,
    isVisible: data.isVisible,
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
  const category = await prisma.wikiCategory.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          articles: true,
        },
      },
    },
  });

  if (!category) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(category);
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
  const existing = await prisma.wikiCategory.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const json = await request.json();
    const data = WikiCategoryFormSchema.parse(json);

    const category = await prisma.wikiCategory.update({
      where: { id },
      data: buildWikiCategoryPayload(data),
      include: {
        _count: {
          select: {
            articles: true,
          },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: "WIKI_CATEGORY_UPDATE",
        target: "WIKI_CATEGORY",
        targetId: category.id,
        details: {
          previousSlug: existing.slug,
          nextSlug: category.slug,
          isVisible: category.isVisible,
        },
      },
    });

    revalidateWikiAdminAndPublicPaths();
    revalidatePath(`/wiki/category/${existing.slug}`);
    revalidatePath(`/wiki/category/${category.slug}`);

    return NextResponse.json(category);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "A wiki category with this slug already exists." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update wiki category." },
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
  const existing = await prisma.wikiCategory.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          articles: true,
        },
      },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing._count.articles > 0) {
    return NextResponse.json(
      { error: "Move or delete the articles in this category before deleting it." },
      { status: 409 }
    );
  }

  await prisma.wikiCategory.delete({
    where: { id },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      userEmail: session.user.email,
      action: "WIKI_CATEGORY_DELETE",
      target: "WIKI_CATEGORY",
      targetId: existing.id,
      details: {
        slug: existing.slug,
      },
    },
  });

  revalidateWikiAdminAndPublicPaths();
  revalidatePath(`/wiki/category/${existing.slug}`);

  return NextResponse.json({ success: true });
}
