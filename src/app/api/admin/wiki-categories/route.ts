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

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.roles.includes("admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const categories = await prisma.wikiCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          articles: true,
        },
      },
    },
  });

  return NextResponse.json(categories);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.roles.includes("admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const data = WikiCategoryFormSchema.parse(json);

    const category = await prisma.wikiCategory.create({
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
        action: "WIKI_CATEGORY_CREATE",
        target: "WIKI_CATEGORY",
        targetId: category.id,
        details: {
          slug: category.slug,
          isVisible: category.isVisible,
        },
      },
    });

    revalidateWikiAdminAndPublicPaths();
    revalidatePath(`/wiki/category/${category.slug}`);

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "A wiki category with this slug already exists." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create wiki category." },
      { status: 400 }
    );
  }
}
