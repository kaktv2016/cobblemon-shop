import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { DeliveryService } from "@/lib/services/delivery.service";

export const runtime = "nodejs";

function isAuthorized(request: NextRequest) {
  const secret = process.env.DELIVERY_CRON_SECRET;
  const authorization = request.headers.get("authorization") || "";
  const supplied = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";

  if (!secret || !supplied) return false;

  const expectedBuffer = Buffer.from(secret);
  const suppliedBuffer = Buffer.from(supplied);
  return expectedBuffer.length === suppliedBuffer.length
    && timingSafeEqual(expectedBuffer, suppliedBuffer);
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await DeliveryService.processQueue(20);
  return NextResponse.json(result);
}
