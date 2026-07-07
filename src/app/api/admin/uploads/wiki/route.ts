import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const uploadDirectory = path.join(process.cwd(), "public", "uploads", "wiki");
const allowedMimeTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
]);

function sanitizeBaseName(fileName: string) {
  return fileName
    .toLowerCase()
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.roles.includes("admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No image file received." }, { status: 400 });
  }

  if (!file.size) {
    return NextResponse.json({ error: "The selected file is empty." }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "Image must be 5MB or smaller." },
      { status: 400 }
    );
  }

  const extension = allowedMimeTypes.get(file.type);

  if (!extension) {
    return NextResponse.json(
      { error: "Only JPG, PNG, WEBP, and GIF files are supported." },
      { status: 400 }
    );
  }

  const safeBaseName = sanitizeBaseName(file.name) || "wiki-cover";
  const fileName = `${safeBaseName}-${randomUUID()}${extension}`;
  const destination = path.join(uploadDirectory, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());

  await mkdir(uploadDirectory, { recursive: true });
  await writeFile(destination, buffer);

  return NextResponse.json({
    url: `/uploads/wiki/${fileName}`,
    fileName,
    size: file.size,
    type: file.type,
  });
}
