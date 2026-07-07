import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { OrderService } from "@/lib/services/order.service";
import { DeliveryService } from "@/lib/services/delivery.service";
import { prisma } from "@/lib/prisma";

/** GET /api/admin/dashboard — Dashboard statistics */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user.roles.includes("admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const [orderStats, deliveryStats, userCount, productCount, recentSignups] =
    await Promise.all([
      OrderService.getOrderStats(),
      DeliveryService.getDeliveryStats(),
      prisma.user.count(),
      prisma.product.count({ where: { isActive: true, visibility: "PUBLIC" } }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, username: true, email: true, createdAt: true },
      }),
    ]);

  return NextResponse.json({
    orders: orderStats,
    delivery: deliveryStats,
    users: {
      total: userCount,
      recentSignups,
    },
    products: {
      active: productCount,
    },
  });
}
