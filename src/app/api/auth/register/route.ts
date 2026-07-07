import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  findAuthmePlayer,
  createAuthmePlayer,
  authmeHash,
} from "@/lib/authme";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  username: z
    .string()
    .min(3, "ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร")
    .max(16, "ชื่อผู้ใช้ต้องไม่เกิน 16 ตัวอักษร")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "ชื่อผู้ใช้ใช้ได้เฉพาะตัวอักษรภาษาอังกฤษ ตัวเลข และขีดล่าง"
    ),
  password: z
    .string()
    .min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")
    .max(100),
});

/** POST /api/auth/register — Create new account (AuthMe + Web) */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = registerSchema.parse(body);

    // 1. Check if username exists in AuthMe database
    const existingAuthme = await findAuthmePlayer(validated.username);
    if (existingAuthme) {
      return NextResponse.json(
        { error: "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว" },
        { status: 409 }
      );
    }

    // 2. Check if email or username already taken in web DB
    const existingWeb = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validated.email },
          { username: validated.username },
        ],
      },
    });

    if (existingWeb) {
      if (existingWeb.email === validated.email) {
        return NextResponse.json(
          { error: "อีเมลนี้ถูกใช้งานแล้ว" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว" },
        { status: 409 }
      );
    }

    // 3. Get client IP for AuthMe record
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      null;

    // 4. Create AuthMe player record (for in-game login)
    await createAuthmePlayer(
      validated.username,
      validated.password,
      validated.email,
      ip || undefined
    );

    // 5. Create web user (for webshop features)
    const playerRole = await prisma.role.findUnique({
      where: { name: "player" },
    });

    const user = await prisma.user.create({
      data: {
        email: validated.email,
        username: validated.username,
        passwordHash: "AUTHME_MANAGED", // Password lives in AuthMe DB
        roles: playerRole
          ? { create: { roleId: playerRole.id } }
          : undefined,
      },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { message: "สร้างบัญชีสำเร็จ", user },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error.message || "ไม่สามารถสร้างบัญชีได้" },
      { status: 400 }
    );
  }
}
