import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DeliveryService } from "@/lib/services/delivery.service";
import { DeliveryJobStatus } from "@prisma/client";

/** GET /api/admin/delivery/logs */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user.roles.includes("admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId") || undefined;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const rawStatus = searchParams.get("status");
  const status = rawStatus && Object.values(DeliveryJobStatus).includes(rawStatus as DeliveryJobStatus)
    ? rawStatus as DeliveryJobStatus
    : undefined;

  const result = await DeliveryService.getDeliveryLogs(jobId, page, limit, status);
  return NextResponse.json(result);
}
