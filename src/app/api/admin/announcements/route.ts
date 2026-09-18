import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { PUBLIC_NEWS_TAG } from "@/lib/public-store-cache";
import { createAnnouncementSchema } from "@/lib/validators/announcement";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user.roles.includes("admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(announcements);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user.roles.includes("admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validated = createAnnouncementSchema.parse(body);

    const announcement = await prisma.announcement.create({
      data: validated,
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: "CREATE_ANNOUNCEMENT",
        target: "announcement",
        targetId: announcement.id,
        details: { title: announcement.title },
      },
    });

    revalidateTag(PUBLIC_NEWS_TAG);
    revalidatePath("/news");

    return NextResponse.json(announcement, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
