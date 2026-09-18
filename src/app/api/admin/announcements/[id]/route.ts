import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { PUBLIC_NEWS_TAG } from "@/lib/public-store-cache";
import { isValidAnnouncementDateRange, updateAnnouncementSchema } from "@/lib/validators/announcement";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user.roles.includes("admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const announcement = await prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      return NextResponse.json(
        { error: "Announcement not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(announcement);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user.roles.includes("admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const validated = updateAnnouncementSchema.parse(body);

    const current = await prisma.announcement.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }
    const startDate = validated.startDate === undefined ? current.startDate : validated.startDate;
    const endDate = validated.endDate === undefined ? current.endDate : validated.endDate;
    if (!isValidAnnouncementDateRange(startDate, endDate)) {
      return NextResponse.json({ error: "End date must be after start date" }, { status: 400 });
    }

    const announcement = await prisma.announcement.update({
      where: { id },
      data: validated,
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: "UPDATE_ANNOUNCEMENT",
        target: "announcement",
        targetId: id,
        details: validated,
      },
    });

    revalidateTag(PUBLIC_NEWS_TAG);
    revalidatePath("/news");

    return NextResponse.json(announcement);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user.roles.includes("admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;

    await prisma.announcement.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: "DELETE_ANNOUNCEMENT",
        target: "announcement",
        targetId: id,
        details: {},
      },
    });

    revalidateTag(PUBLIC_NEWS_TAG);
    revalidatePath("/news");

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
