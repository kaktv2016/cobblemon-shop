import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CategoryReorderSchema } from "@/lib/admin/validation";
import { PUBLIC_CATALOG_TAG } from "@/lib/public-store-cache";

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user.roles.includes("admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { orderedIds } = CategoryReorderSchema.parse(await request.json());
    if (new Set(orderedIds).size !== orderedIds.length) {
      return NextResponse.json({ error: "Duplicate category IDs" }, { status: 400 });
    }

    const existingCount = await prisma.category.count({ where: { id: { in: orderedIds } } });
    if (existingCount !== orderedIds.length) {
      return NextResponse.json({ error: "One or more categories do not exist" }, { status: 404 });
    }

    await prisma.$transaction([
      ...orderedIds.map((id, index) =>
        prisma.category.update({ where: { id }, data: { sortOrder: index + 1 } })
      ),
      prisma.auditLog.create({
        data: {
          userId: session.user.id,
          userEmail: session.user.email,
          action: "REORDER_CATEGORIES",
          target: "category",
          details: { orderedIds },
        },
      }),
    ]);

    revalidateTag(PUBLIC_CATALOG_TAG);
    revalidatePath("/");
    revalidatePath("/store");
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to reorder categories" },
      { status: 400 }
    );
  }
}
