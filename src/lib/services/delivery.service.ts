import { prisma } from "@/lib/prisma";
import { DeliveryJobStatus } from "@prisma/client";
import { createHash } from "crypto";
import { getDeliveryAdapter } from "@/lib/delivery/adapter";

/**
 * Allowed template variables — whitelist prevents injection
 */
const ALLOWED_TEMPLATE_VARS = [
  "player_name",
  "player_uuid",
  "order_id",
  "product_id",
  "quantity",
];

/**
 * Render a delivery command template with safe variable substitution
 */
function renderTemplate(
  template: string,
  variables: Record<string, string | number>
): string {
  let result = template;

  for (const [key, value] of Object.entries(variables)) {
    if (!ALLOWED_TEMPLATE_VARS.includes(key)) continue;
    result = result.replaceAll(`{${key}}`, String(value));
  }

  return result;
}

/**
 * Generate idempotency key for delivery deduplication
 */
function generateIdempotencyKey(
  orderItemId: string,
  attempt: number
): string {
  const raw = `delivery-${orderItemId}-${attempt}`;
  return createHash("sha256").update(raw).digest("hex").substring(0, 64);
}

/**
 * DeliveryService handles Minecraft item delivery pipeline
 * Core safety features: idempotency, retry, audit trail, template-based commands
 */
export class DeliveryService {
  /**
   * Create delivery jobs for all items in an order
   */
  static async createDeliveryJobs(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              include: { deliveryTemplate: true },
            },
          },
        },
      },
    });

    if (!order) throw new Error(`Order "${orderId}" not found`);

    const jobs = [];

    for (const item of order.items) {
      const template = item.product?.deliveryTemplate;
      if (!template) {
        console.warn(`No delivery template for product ${item.productId}. Skipping.`);
        continue;
      }

      const renderedCommand = renderTemplate(template.commandTemplate, {
        player_name: order.playerName || "unknown",
        player_uuid: order.playerUuid || "unknown",
        order_id: order.id,
        product_id: item.productId || "unknown",
        quantity: item.quantity,
      });

      const idempotencyKey = generateIdempotencyKey(item.id, 0);

      // Check for existing job with same idempotency key
      const existing = await prisma.deliveryJob.findUnique({
        where: { idempotencyKey },
      });

      if (existing) {
        jobs.push(existing);
        continue;
      }

      const job = await prisma.deliveryJob.create({
        data: {
          orderId,
          orderItemId: item.id,
          idempotencyKey,
          templateId: template.id,
          renderedCommand,
          status: "PENDING",
          attempts: 0,
          maxAttempts: 3,
          isDryRun: process.env.DELIVERY_MODE === "dry-run",
        },
      });

      jobs.push(job);
    }

    // Update order status to QUEUED_DELIVERY
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "QUEUED_DELIVERY" },
    });

    return jobs;
  }

  /**
   * Process a single delivery job
   */
  static async processDeliveryJob(jobId: string) {
    const job = await prisma.deliveryJob.findUnique({
      where: { id: jobId },
      include: { orderItem: true },
    });

    if (!job) throw new Error(`Delivery job "${jobId}" not found`);

    // Idempotency check
    if (job.status === "SUCCESS") {
      return { success: true, message: "Already delivered (idempotent)" };
    }

    if (job.status !== "PENDING" && job.status !== "FAILED") {
      return { success: false, message: `Cannot process job in status: ${job.status}` };
    }

    const adapter = getDeliveryAdapter();
    const newAttempts = job.attempts + 1;

    // Mark as processing
    await prisma.deliveryJob.update({
      where: { id: jobId },
      data: { status: "PROCESSING", lastAttemptAt: new Date() },
    });

    try {
      const result = await adapter.execute(job.renderedCommand, {
        playerName: job.orderItem?.id || "",
        playerUuid: "",
        orderId: job.orderId,
        isDryRun: job.isDryRun,
      });

      // Log success
      await prisma.deliveryLog.create({
        data: {
          jobId,
          attempt: newAttempts,
          status: "SUCCESS",
          command: job.renderedCommand,
          response: result.response,
        },
      });

      await prisma.deliveryJob.update({
        where: { id: jobId },
        data: {
          status: "SUCCESS",
          attempts: newAttempts,
          response: result.response,
        },
      });

      // Update order item delivery status
      await prisma.orderItem.update({
        where: { id: job.orderItemId },
        data: { deliveryStatus: "DELIVERED", deliveredAt: new Date() },
      });

      // Check if full order is delivered
      await this.checkOrderDeliveryComplete(job.orderId);

      return { success: true, message: "Delivered successfully" };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";

      await prisma.deliveryLog.create({
        data: {
          jobId,
          attempt: newAttempts,
          status: "FAILED",
          command: job.renderedCommand,
          error: errorMsg,
        },
      });

      if (newAttempts < job.maxAttempts) {
        // Schedule retry with exponential backoff
        const backoffMs = Math.pow(3, newAttempts) * 60 * 1000; // 3min, 9min, 27min
        const nextRetry = new Date(Date.now() + backoffMs);

        await prisma.deliveryJob.update({
          where: { id: jobId },
          data: {
            status: "PENDING",
            attempts: newAttempts,
            nextRetryAt: nextRetry,
            error: errorMsg,
          },
        });

        return { success: false, message: `Failed. Retry scheduled at ${nextRetry.toISOString()}` };
      } else {
        await prisma.deliveryJob.update({
          where: { id: jobId },
          data: {
            status: "FAILED",
            attempts: newAttempts,
            error: errorMsg,
          },
        });

        // Update order item status
        await prisma.orderItem.update({
          where: { id: job.orderItemId },
          data: { deliveryStatus: "FAILED" },
        });

        await this.checkOrderDeliveryComplete(job.orderId);

        return { success: false, message: "Failed. Max retries exceeded." };
      }
    }
  }

  /**
   * Retry a failed delivery job
   */
  static async retryFailedJob(jobId: string) {
    const job = await prisma.deliveryJob.findUnique({ where: { id: jobId } });
    if (!job) throw new Error(`Job "${jobId}" not found`);
    if (job.status !== "FAILED") {
      throw new Error(`Cannot retry job in status "${job.status}". Only FAILED jobs can be retried.`);
    }

    return await prisma.deliveryJob.update({
      where: { id: jobId },
      data: {
        status: "PENDING",
        nextRetryAt: null,
        error: null,
      },
    });
  }

  /**
   * Process all pending delivery jobs in batch
   */
  static async processQueue(batchSize: number = 10) {
    const jobs = await prisma.deliveryJob.findMany({
      where: {
        status: "PENDING",
        OR: [
          { nextRetryAt: null },
          { nextRetryAt: { lte: new Date() } },
        ],
      },
      take: batchSize,
      orderBy: { createdAt: "asc" },
    });

    let succeeded = 0;
    let failed = 0;

    for (const job of jobs) {
      try {
        const result = await this.processDeliveryJob(job.id);
        if (result.success) succeeded++;
        else failed++;
      } catch (error) {
        console.error(`Error processing job ${job.id}:`, error);
        failed++;
      }
    }

    return { processed: jobs.length, succeeded, failed };
  }

  /**
   * Get delivery queue with filters
   */
  static async getDeliveryQueue(
    status?: string,
    page: number = 1,
    limit: number = 50
  ) {
    const skip = (page - 1) * limit;
    const where = status ? { status: status as DeliveryJobStatus } : {};

    const [jobs, total] = await Promise.all([
      prisma.deliveryJob.findMany({
        where,
        include: {
          order: { select: { orderNumber: true, playerName: true } },
          orderItem: { select: { productName: true, quantity: true } },
          template: { select: { name: true } },
          _count: { select: { logs: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.deliveryJob.count({ where }),
    ]);

    return { data: jobs, total, page, limit, pages: Math.ceil(total / limit) };
  }

  /**
   * Get logs for a specific delivery job
   */
  static async getDeliveryLogs(
    jobId?: string,
    page: number = 1,
    limit: number = 50
  ) {
    const skip = (page - 1) * limit;
    const where = jobId ? { jobId } : {};

    const [logs, total] = await Promise.all([
      prisma.deliveryLog.findMany({
        where,
        include: {
          job: {
            select: {
              orderId: true,
              renderedCommand: true,
              order: { select: { orderNumber: true, playerName: true } },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { executedAt: "desc" },
      }),
      prisma.deliveryLog.count({ where }),
    ]);

    return { data: logs, total, page, limit, pages: Math.ceil(total / limit) };
  }

  /**
   * Get delivery statistics for dashboard
   */
  static async getDeliveryStats() {
    const [byStatus, totalJobs] = await Promise.all([
      prisma.deliveryJob.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      prisma.deliveryJob.count(),
    ]);

    const statsByStatus = Object.fromEntries(
      byStatus.map((s) => [s.status, s._count.id])
    );

    return {
      byStatus: statsByStatus,
      totalJobs,
      successfulJobs: statsByStatus["SUCCESS"] || 0,
      failedJobs: statsByStatus["FAILED"] || 0,
      pendingJobs: (statsByStatus["PENDING"] || 0) + (statsByStatus["PROCESSING"] || 0),
    };
  }

  /**
   * Check if all items in an order are delivered or failed
   */
  private static async checkOrderDeliveryComplete(orderId: string) {
    const pendingJobs = await prisma.deliveryJob.count({
      where: {
        orderId,
        status: { in: ["PENDING", "PROCESSING"] },
      },
    });

    if (pendingJobs > 0) return;

    const failedJobs = await prisma.deliveryJob.count({
      where: { orderId, status: "FAILED" },
    });

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.status !== "QUEUED_DELIVERY") return;

    if (failedJobs > 0) {
      const successJobs = await prisma.deliveryJob.count({
        where: { orderId, status: "SUCCESS" },
      });
      await prisma.order.update({
        where: { id: orderId },
        data: { status: successJobs > 0 ? "PARTIALLY_DELIVERED" : "FAILED_DELIVERY" },
      });
    } else {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "DELIVERED" },
      });
    }
  }
}
