import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DeliveryService } from "@/lib/services/delivery.service";
import { prisma } from "@/lib/prisma";

/** GET /api/admin/delivery/queue */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user.roles.includes("admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  const result = await DeliveryService.getDeliveryQueue(status, page, limit);
  return NextResponse.json(result);
}

/** POST /api/admin/delivery/queue — Process queue or retry specific job */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user.roles.includes("admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();

    if (body.action === "process_queue") {
      const result = await DeliveryService.processQueue(body.batchSize || 10);
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          userEmail: session.user.email,
          action: "PROCESS_DELIVERY_QUEUE",
          target: "delivery",
          details: result,
        },
      });
      return NextResponse.json(result);
    }

    if (body.action === "retry" && body.jobId) {
      const job = await DeliveryService.retryFailedJob(body.jobId);
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          userEmail: session.user.email,
          action: "RETRY_DELIVERY",
          target: "delivery_job",
          targetId: body.jobId,
        },
      });
      return NextResponse.json(job);
    }

    if (body.action === "process_job" && body.jobId) {
      const result = await DeliveryService.processDeliveryJob(body.jobId);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
