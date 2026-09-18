import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_STORE_SETTINGS,
  getDeliveryConfigurationStatus,
  STORE_SETTINGS_ID,
  STORE_SETTINGS_TAG,
} from "@/lib/store-settings";

const settingsSchema = z.object({
  shopName: z.string().trim().min(1).max(255),
  shopDescription: z.string().trim().max(500),
  maintenanceMode: z.boolean(),
  maintenanceMessage: z.string().trim().max(1000).optional().nullable(),
});

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user.roles.includes("admin") ? session : null;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const settings = await prisma.storeSettings.upsert({
    where: { id: STORE_SETTINGS_ID },
    update: {},
    create: DEFAULT_STORE_SETTINGS,
  });

  return NextResponse.json({
    settings,
    delivery: getDeliveryConfigurationStatus(),
  });
}

export async function PUT(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const values = settingsSchema.parse(await request.json());
    const settings = await prisma.$transaction(async (tx) => {
      const updated = await tx.storeSettings.upsert({
        where: { id: STORE_SETTINGS_ID },
        update: { ...values, currency: "THB" },
        create: { id: STORE_SETTINGS_ID, ...values, currency: "THB" },
      });
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          userEmail: session.user.email,
          action: "UPDATE_STORE_SETTINGS",
          target: "STORE_SETTINGS",
          targetId: STORE_SETTINGS_ID,
          details: {
            shopName: values.shopName,
            maintenanceMode: values.maintenanceMode,
          },
        },
      });
      return updated;
    });

    revalidateTag(STORE_SETTINGS_TAG);
    revalidatePath("/", "layout");
    return NextResponse.json({ settings, delivery: getDeliveryConfigurationStatus() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid settings";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
