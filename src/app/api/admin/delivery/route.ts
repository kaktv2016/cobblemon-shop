import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DeliveryService } from "@/lib/services/delivery.service";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const deliveryQuerySchema = z.object({
  status: z.enum(["PENDING", "PROCESSING", "SUCCESS", "FAILED", "SKIPPED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

/** GET /api/admin/delivery/queue */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user.roles.includes("admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const query = deliveryQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams.entries())
    );
    const [result, deliveryStats] = await Promise.all([
      DeliveryService.getDeliveryQueue(query.status, query.page, query.limit),
      DeliveryService.getDeliveryStats(),
    ]);
    return NextResponse.json({
      data: result.data.map((job) => ({
        id: job.id,
        orderId: job.orderId,
        orderNumber: job.order.orderNumber,
        productName: job.orderItem.productName,
        playerName: job.order.playerName || "-",
        command: job.renderedCommand,
        sequence: job.sequence,
        status: job.status,
        attempts: job.attempts,
        maxAttempts: job.maxAttempts,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        lastAttemptAt: job.lastAttemptAt,
        nextRetryAt: job.nextRetryAt,
        error: job.error,
      })),
      stats: {
        pending: deliveryStats.byStatus.PENDING || 0,
        processing: deliveryStats.byStatus.PROCESSING || 0,
        failed: deliveryStats.byStatus.FAILED || 0,
        completed: deliveryStats.byStatus.SUCCESS || 0,
      },
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: result.pages,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load delivery queue";
    return NextResponse.json({ error: message }, { status: 400 });
  }
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
      const result = await DeliveryService.wakePendingJobs(undefined, body.batchSize || 10);
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          userEmail: session.user.email,
          action: "WAKE_DELIVERY_QUEUE",
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
      const result = await DeliveryService.wakePendingJobs(body.jobId, 1);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
