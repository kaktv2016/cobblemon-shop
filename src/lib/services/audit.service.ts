import { prisma } from "@/lib/prisma";

interface AuditLogEntry {
  id: string;
  userId: string | null;
  userEmail: string | null;
  action: string;
  target: string;
  targetId: string | null;
  details: any;
  ipAddress?: string;
  createdAt: Date;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface AuditLogFilters {
  userId?: string;
  action?: string;
  target?: string;
  from?: Date;
  to?: Date;
}

/**
 * Service for audit logging
 */
export class AuditService {
  /**
   * Log an action to the audit log
   *
   * @param userId User ID who performed the action (null for system actions)
   * @param userEmail Email of the user
   * @param action Action performed (e.g., "CREATE", "UPDATE", "DELETE", "LOGIN")
   * @param target Target entity type (e.g., "PRODUCT", "ORDER", "USER", "AUTH")
   * @param targetId ID of the target entity
   * @param details Additional details about the action
   * @param ipAddress IP address of the request
   */
  static async logAction(
    userId: string | null,
    userEmail: string,
    action: string,
    target: string,
    targetId: string,
    details?: Record<string, any>,
    ipAddress?: string
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: userId || undefined,
          userEmail,
          action: action.toUpperCase(),
          target: target.toUpperCase(),
          targetId,
          details: details || undefined,
          ipAddress,
        },
      });
    } catch (error) {
      // Log to console but don't throw - audit logging should not break the application
      console.error("Failed to log audit event:", error);
    }
  }

  /**
   * Get audit logs with optional filtering and pagination
   */
  static async getAuditLogs(
    filters: AuditLogFilters = {},
    page: number = 1,
    limit: number = 50
  ): Promise<PaginatedResponse<AuditLogEntry>> {
    // Validate pagination parameters
    const validPage = Math.max(1, Math.floor(page));
    const validLimit = Math.min(Math.max(1, Math.floor(limit)), 100); // Max 100 per page
    const skip = (validPage - 1) * validLimit;

    // Build where clause
    const where: any = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.action) {
      where.action = {
        contains: filters.action.toUpperCase(),
        mode: "insensitive",
      };
    }

    if (filters.target) {
      where.target = {
        contains: filters.target.toUpperCase(),
        mode: "insensitive",
      };
    }

    // Date range filter
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) {
        where.createdAt.gte = filters.from;
      }
      if (filters.to) {
        where.createdAt.lte = filters.to;
      }
    }

    // Execute queries
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        select: {
          id: true,
          userId: true,
          userEmail: true,
          action: true,
          target: true,
          targetId: true,
          details: true,
          ipAddress: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: validLimit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    const pages = Math.ceil(total / validLimit);

    return {
      data: logs.map((log: any) => ({
        id: log.id,
        userId: log.userId,
        userEmail: log.userEmail,
        action: log.action,
        target: log.target,
        targetId: log.targetId,
        details: log.details,
        ipAddress: log.ipAddress || undefined,
        createdAt: new Date(log.createdAt),
      })),
      total,
      page: validPage,
      limit: validLimit,
      pages,
    };
  }

  /**
   * Delete old audit logs (for cleanup)
   * Only keeps logs from the last N days
   */
  static async cleanupOldLogs(retentionDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }

  /**
   * Export audit logs for compliance/analysis
   */
  static async exportLogs(
    filters: AuditLogFilters = {},
    format: "json" | "csv" = "json"
  ): Promise<string> {
    // Fetch all matching logs (no limit for export)
    const where: any = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.action) {
      where.action = {
        contains: filters.action.toUpperCase(),
        mode: "insensitive",
      };
    }

    if (filters.target) {
      where.target = {
        contains: filters.target.toUpperCase(),
        mode: "insensitive",
      };
    }

    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) {
        where.createdAt.gte = filters.from;
      }
      if (filters.to) {
        where.createdAt.lte = filters.to;
      }
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    if (format === "csv") {
      return this.convertToCSV(logs);
    }

    return JSON.stringify(logs, null, 2);
  }

  /**
   * Convert audit logs to CSV format
   */
  private static convertToCSV(
    logs: any[]
  ): string {
    const headers = [
      "ID",
      "User ID",
      "User Email",
      "Action",
      "Target",
      "Target ID",
      "IP Address",
      "Created At",
    ];

    const rows = logs.map((log) => [
      log.id,
      log.userId || "",
      log.userEmail,
      log.action,
      log.target,
      log.targetId,
      log.ipAddress || "",
      new Date(log.createdAt).toISOString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) => {
            // Escape CSV cells
            if (typeof cell === "string" && (cell.includes(",") || cell.includes('"'))) {
              return `"${cell.replace(/"/g, '""')}"`;
            }
            return cell;
          })
          .join(",")
      ),
    ].join("\n");

    return csvContent;
  }
}
