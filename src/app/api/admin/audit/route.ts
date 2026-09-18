import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { AuditService } from "@/lib/services/audit.service";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  userEmail: z.string().trim().max(255).optional(),
  action: z.string().trim().max(255).optional(),
  target: z.string().trim().max(100).optional(),
  dateFrom: z.string().trim().max(40).optional(),
  dateTo: z.string().trim().max(40).optional(),
  format: z.enum(["json", "csv"]).default("json"),
});

function parseAuditDate(value: string | undefined, endOfDay = false) {
  if (!value) return undefined;
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const parsed = new Date(
    dateOnly
      ? `${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}+07:00`
      : value
  );
  if (Number.isNaN(parsed.getTime())) throw new Error("Invalid audit date filter");
  return parsed;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user.roles.includes("admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const raw = Object.fromEntries(new URL(request.url).searchParams.entries());
    const query = querySchema.parse(raw);
    const from = parseAuditDate(query.dateFrom);
    const to = parseAuditDate(query.dateTo, true);
    if (from && to && to < from) throw new Error("To date must be on or after from date");
    const filters = {
      userEmail: query.userEmail || undefined,
      action: query.action || undefined,
      target: query.target || undefined,
      from,
      to,
    };

    if (query.format === "csv") {
      const csv = await AuditService.exportLogs(filters, "csv");
      return new NextResponse(`\uFEFF${csv}`, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="audit-logs-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json(
      await AuditService.getAuditLogs(filters, query.page, query.limit)
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid audit query";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
