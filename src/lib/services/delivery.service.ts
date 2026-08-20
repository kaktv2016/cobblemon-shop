import { prisma } from "@/lib/prisma";
import { DeliveryJobStatus } from "@prisma/client";
import { createHash } from "crypto";
import { getDeliveryAdapter } from "@/lib/delivery/adapter";
import type { DeliveryResult } from "@/lib/delivery/adapter";

const OFFLINE_RETRY_MS = 30_000;
const STALE_PROCESSING_MS = 2 * 60_000;

/**
 * Allowed template variables — whitelist prevents injection
 */
const ALLOWED_TEMPLATE_VARS = [
  "player_name",
  "player_uuid",
  "order_id",
  "product_id",
  "product_slug",
  "delivery_key",
  "delivery_amount",
  "quantity",
];

function getMetadataValue(
  metadata: unknown,
  keys: string[],
  fallback: string | number
): string | number {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return fallback;
  }

  const record = metadata as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" || typeof value === "number") {
      return value;
    }
  }

  return fallback;
}

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

function buildDeliveryCommand(
  template: { commandTemplate: string },
  product: { slug: string; metadata: unknown },
  item: { productId: string | null; quantity: number },
  order: { id: string; playerName: string | null; playerUuid: string | null }
) {
  const deliveryKey = getMetadataValue(
    product.metadata,
    ["deliveryKey", "serverItem", "serverId"],
    product.slug
  );
  const unitDeliveryAmount = getMetadataValue(
    product.metadata,
    ["deliveryAmount", "coinAmount", "amount"],
    1
  );
  const deliveryAmount =
    typeof unitDeliveryAmount === "number"
      ? unitDeliveryAmount * item.quantity
      : unitDeliveryAmount;

  return renderTemplate(template.commandTemplate, {
    player_name: order.playerName || "",
    player_uuid: order.playerUuid || "",
    order_id: order.id,
    product_id: item.productId || "",
    product_slug: product.slug,
    delivery_key: deliveryKey,
    delivery_amount: deliveryAmount,
    quantity: item.quantity,
  });
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

    if (!order.playerName) {
      throw new Error("Order has no Minecraft username");
    }

    if (!["PAID", "QUEUED_DELIVERY"].includes(order.status)) {
      throw new Error(`Order must be paid before delivery (current: ${order.status})`);
    }

    const invalidItem = order.items.find(
      (item) =>
        !item.product
        || !item.product.deliveryTemplate
        || !item.product.deliveryTemplate.isActive
    );
    if (invalidItem) {
      throw new Error(`No active delivery template for product "${invalidItem.productName}"`);
    }

    const jobs = [];

    for (const item of order.items) {
      const product = item.product!;
      const template = product.deliveryTemplate!;

      const renderedCommand = buildDeliveryCommand(template, product, item, order);

      const idempotencyKey = generateIdempotencyKey(item.id, 0);

      const job = await prisma.deliveryJob.upsert({
        where: { idempotencyKey },
        update: {},
        create: {
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

      if (job.status !== "SUCCESS") {
        await prisma.orderItem.update({
          where: { id: item.id },
          data: { deliveryStatus: "QUEUED" },
        });
      }

      jobs.push(job);
    }

    if (jobs.length === 0) {
      throw new Error("No delivery jobs were created for this order");
    }

    // A duplicate payment callback may race with a fast worker. Only advance
    // PAID orders so an already delivered order can never move backwards.
    if (jobs.some((job) => job.status !== "SUCCESS")) {
      await prisma.order.updateMany({
        where: { id: orderId, status: "PAID" },
        data: { status: "QUEUED_DELIVERY" },
      });
    }

    return jobs;
  }

  /** Queue an order idempotently. The standalone worker owns execution. */
  static async queueOrder(orderId: string) {
    const jobs = await this.createDeliveryJobs(orderId);
    return {
      queued: jobs.length,
      succeeded: jobs.filter((job) => job.status === "SUCCESS").length,
      failed: jobs.filter((job) => job.status === "FAILED").length,
    };
  }

  /**
   * Process a single delivery job
   */
  static async processDeliveryJob(jobId: string) {
    const job = await prisma.deliveryJob.findUnique({
      where: { id: jobId },
      include: {
        order: true,
        orderItem: {
          include: {
            product: {
              include: { deliveryTemplate: true },
            },
          },
        },
      },
    });

    if (!job) throw new Error(`Delivery job "${jobId}" not found`);

    // Idempotency check
    if (job.status === "SUCCESS") {
      return { success: true, message: "Already delivered (idempotent)" };
    }

    if (job.status !== "PENDING") {
      return { success: false, message: `Cannot process job in status: ${job.status}` };
    }

    // Claim the job atomically so concurrent queue runners cannot deliver it twice.
    const claimed = await prisma.deliveryJob.updateMany({
      where: {
        id: jobId,
        status: "PENDING",
        OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: new Date() } }],
      },
      data: { status: "PROCESSING", lastAttemptAt: new Date() },
    });

    if (claimed.count !== 1) {
      return { success: false, message: "Delivery job is already being processed" };
    }

    const currentProduct = job.orderItem.product;
    const currentTemplate = currentProduct?.deliveryTemplate;
    const commandToExecute =
      currentProduct && currentTemplate?.isActive
        ? buildDeliveryCommand(currentTemplate, currentProduct, job.orderItem, job.order)
        : job.renderedCommand;

    if (
      commandToExecute !== job.renderedCommand ||
      (currentTemplate && currentTemplate.id !== job.templateId)
    ) {
      await prisma.deliveryJob.update({
        where: { id: jobId },
        data: {
          renderedCommand: commandToExecute,
          ...(currentTemplate ? { templateId: currentTemplate.id } : {}),
        },
      });
    }

    let result: DeliveryResult;
    try {
      const adapter = getDeliveryAdapter();
      result = await adapter.execute(commandToExecute, {
        playerName: job.order.playerName || "",
        playerUuid: job.order.playerUuid || undefined,
        orderId: job.orderId,
        isDryRun: job.isDryRun,
      });

    } catch (error) {
      result = {
        success: false,
        kind: "connection",
        error: error instanceof Error ? error.message : "Delivery adapter initialization failed",
      };
    }

    if (result.success) {
      const newAttempts = job.attempts + 1;
      await prisma.deliveryLog.create({
        data: {
          jobId,
          attempt: newAttempts,
          status: "SUCCESS",
          command: commandToExecute,
          response: result.response,
        },
      });

      await prisma.deliveryJob.update({
        where: { id: jobId },
        data: {
          status: "SUCCESS",
          attempts: newAttempts,
          response: result.response,
          error: null,
          nextRetryAt: null,
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
    }

    const errorMsg = result.error || "Unknown delivery error";

    if (result.kind === "offline") {
      const nextRetry = new Date(Date.now() + OFFLINE_RETRY_MS);
      await prisma.deliveryJob.update({
        where: { id: jobId },
        data: {
          status: "PENDING",
          nextRetryAt: nextRetry,
          error: `PLAYER_OFFLINE: ${errorMsg}`,
        },
      });
      return { success: false, deferred: true, reason: "offline", message: "Player is offline" };
    }

    if (result.kind === "connection") {
      const previousRetry = /^CONNECTION_RETRY:(\d+):/.exec(job.error || "");
      const retryNumber = (previousRetry ? Number(previousRetry[1]) : 0) + 1;
      const backoffMs = Math.min(60_000, 5_000 * Math.pow(2, retryNumber - 1));
      const nextRetry = new Date(Date.now() + backoffMs);

      await prisma.deliveryJob.update({
        where: { id: jobId },
        data: {
          status: "PENDING",
          nextRetryAt: nextRetry,
          error: `CONNECTION_RETRY:${retryNumber}: ${errorMsg}`,
        },
      });
      return { success: false, deferred: true, reason: "connection", message: "Server connection unavailable" };
    }

    const newAttempts = job.attempts + 1;

    await prisma.deliveryLog.create({
      data: {
        jobId,
        attempt: newAttempts,
        status: "FAILED",
        command: commandToExecute,
        error: errorMsg,
      },
    });

    if (result.kind === "unknown") {
      await prisma.deliveryJob.update({
        where: { id: jobId },
        data: {
          status: "FAILED",
          attempts: newAttempts,
          nextRetryAt: null,
          error: `MANUAL_REVIEW_REQUIRED: ${errorMsg}`,
        },
      });
      await prisma.orderItem.update({
        where: { id: job.orderItemId },
        data: { deliveryStatus: "FAILED" },
      });
      await this.checkOrderDeliveryComplete(job.orderId);
      return { success: false, reason: "unknown", message: "Manual review required" };
    }

    if (newAttempts < job.maxAttempts) {
      const backoffMs = Math.pow(3, newAttempts) * 60 * 1000;
      const nextRetry = new Date(Date.now() + backoffMs);

      await prisma.deliveryJob.update({
        where: { id: jobId },
        data: {
          status: "PENDING",
          attempts: newAttempts,
          nextRetryAt: nextRetry,
          error: `COMMAND_REJECTED: ${errorMsg}`,
        },
      });

      return { success: false, reason: "command_rejected", message: `Retry scheduled at ${nextRetry.toISOString()}` };
    }

    await prisma.deliveryJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        attempts: newAttempts,
        nextRetryAt: null,
        error: `COMMAND_REJECTED: ${errorMsg}`,
      },
    });

    await prisma.orderItem.update({
      where: { id: job.orderItemId },
      data: { deliveryStatus: "FAILED" },
    });

    await this.checkOrderDeliveryComplete(job.orderId);
    return { success: false, reason: "command_rejected", message: "Max retries exceeded" };
  }

  /** Mark abandoned claims for manual review because their send outcome is unknown. */
  static async recoverStaleProcessingJobs() {
    const staleBefore = new Date(Date.now() - STALE_PROCESSING_MS);
    const staleJobs = await prisma.deliveryJob.findMany({
      where: { status: "PROCESSING", lastAttemptAt: { lt: staleBefore } },
      select: { id: true, orderItemId: true, orderId: true },
    });

    for (const job of staleJobs) {
      await prisma.deliveryJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          nextRetryAt: null,
          error: "MANUAL_REVIEW_REQUIRED: Worker stopped while delivery was processing",
        },
      });
      await prisma.orderItem.update({
        where: { id: job.orderItemId },
        data: { deliveryStatus: "FAILED" },
      });
      await this.checkOrderDeliveryComplete(job.orderId);
    }

    return staleJobs.length;
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

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.deliveryJob.update({
        where: { id: jobId },
        data: {
          status: "PENDING",
          nextRetryAt: null,
          error: null,
        },
      });

      await tx.orderItem.update({
        where: { id: job.orderItemId },
        data: { deliveryStatus: "QUEUED", deliveredAt: null },
      });

      await tx.order.updateMany({
        where: {
          id: job.orderId,
          status: { in: ["FAILED_DELIVERY", "PARTIALLY_DELIVERED"] },
        },
        data: { status: "QUEUED_DELIVERY" },
      });

      return updated;
    });
  }

  /** Make pending jobs immediately eligible for the standalone worker. */
  static async wakePendingJobs(jobId?: string, batchSize: number = 10) {
    const jobs = await prisma.deliveryJob.findMany({
      where: { status: "PENDING", ...(jobId ? { id: jobId } : {}) },
      select: { id: true },
      take: Math.min(Math.max(batchSize, 1), 100),
      orderBy: { createdAt: "asc" },
    });

    if (jobs.length === 0) return { queued: 0 };

    const result = await prisma.deliveryJob.updateMany({
      where: { id: { in: jobs.map((job) => job.id) }, status: "PENDING" },
      data: { nextRetryAt: null },
    });

    return { queued: result.count };
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
