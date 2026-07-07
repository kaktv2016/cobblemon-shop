import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { OrderService } from "@/lib/services/order.service";
import { DeliveryService } from "@/lib/services/delivery.service";
import { prisma } from "@/lib/prisma";

/** GET /api/admin/orders/[id] */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user.roles.includes("admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const order = await OrderService.getOrderById(id);

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json(order);
}

/** PATCH /api/admin/orders/[id] — Update order status */
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
    const { status, action } = body;

    // Handle special actions
    if (action === "create_delivery_jobs") {
      const jobs = await DeliveryService.createDeliveryJobs(id);
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          userEmail: session.user.email,
          action: "CREATE_DELIVERY_JOBS",
          target: "order",
          targetId: id,
          details: { jobCount: jobs.length },
        },
      });
      return NextResponse.json({ success: true, jobCount: jobs.length });
    }

    if (action === "process_delivery") {
      const result = await DeliveryService.processQueue(10);
      return NextResponse.json(result);
    }

    // Status update
    if (status) {
      const order = await OrderService.updateOrderStatus(id, status);
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          userEmail: session.user.email,
          action: "UPDATE_ORDER_STATUS",
          target: "order",
          targetId: id,
          details: { newStatus: status },
        },
      });
      return NextResponse.json(order);
    }

    return NextResponse.json({ error: "No action or status provided" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
