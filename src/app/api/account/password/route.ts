import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { authmeVerify, findAuthmePlayer, updateAuthmePassword } from "@/lib/authme";
import { prisma } from "@/lib/prisma";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters").max(100),
}).refine((value) => value.currentPassword !== value.newPassword, {
  path: ["newPassword"], message: "New password must be different from the current password",
});

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const values = passwordSchema.parse(await request.json());
    const player = await findAuthmePlayer(session.user.username);
    if (!player || !authmeVerify(values.currentPassword, player.password)) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }
    await updateAuthmePassword(session.user.username, values.newPassword);
    await prisma.auditLog.create({
      data: { userId: session.user.id, userEmail: session.user.email, action: "CHANGE_PASSWORD", target: "AUTH", targetId: session.user.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message || "Invalid password" }, { status: 400 });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to change password" }, { status: 400 });
  }
}
