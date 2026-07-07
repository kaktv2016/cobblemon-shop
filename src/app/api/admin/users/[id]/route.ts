import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user.roles.includes("admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      isActive: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
      roles: { select: { role: { select: { id: true, name: true } } } },
      minecraftAccount: true,
      orders: {
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          createdAt: true,
        },
      },
      _count: { select: { orders: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user.roles.includes("admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();

    // Handle role assignment
    if (body.roleId) {
      const existingRole = await prisma.userRole.findFirst({
        where: { userId: id, roleId: body.roleId },
      });

      if (body.action === "add_role" && !existingRole) {
        await prisma.userRole.create({
          data: { userId: id, roleId: body.roleId },
        });
      } else if (body.action === "remove_role" && existingRole) {
        await prisma.userRole.delete({
          where: { userId_roleId: { userId: id, roleId: body.roleId } },
        });
      }

      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          userEmail: session.user.email,
          action: body.action === "add_role" ? "ASSIGN_ROLE" : "REMOVE_ROLE",
          target: "user",
          targetId: id,
          details: { roleId: body.roleId },
        },
      });

      return NextResponse.json({ success: true });
    }

    // Handle user updates
    const updateData: any = {};
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.displayName !== undefined) updateData.displayName = body.displayName;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email,
        action: "UPDATE_USER",
        target: "user",
        targetId: id,
        details: updateData,
      },
    });

    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
