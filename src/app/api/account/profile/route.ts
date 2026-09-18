import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const profileSchema = z.object({
  displayName: z.string().trim().max(255).nullable().optional(),
  avatarUrl: z.string().trim().max(2000).refine((value) => {
    if (!value || value.startsWith("/")) return true;
    try { new URL(value); return true; } catch { return false; }
  }, "Avatar must be a valid URL or local path").nullable().optional(),
});

async function sessionUser() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  return { session, user: await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, username: true, email: true, displayName: true, avatarUrl: true },
  }) };
}

export async function GET() {
  const result = await sessionUser();
  if (!result) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!result.user) return NextResponse.json({ error: "Account not found" }, { status: 404 });
  return NextResponse.json(result.user);
}

export async function PUT(request: NextRequest) {
  const result = await sessionUser();
  if (!result) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const values = profileSchema.parse(await request.json());
    const user = await prisma.user.update({
      where: { id: result.session.user.id },
      data: {
        displayName: values.displayName?.trim() || null,
        avatarUrl: values.avatarUrl?.trim() || null,
      },
      select: { id: true, username: true, email: true, displayName: true, avatarUrl: true },
    });
    await prisma.auditLog.create({
      data: { userId: user.id, userEmail: user.email, action: "UPDATE_PROFILE", target: "USER", targetId: user.id },
    });
    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message || "Invalid profile" }, { status: 400 });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update profile" }, { status: 400 });
  }
}
