import { NextResponse } from "next/server";

/**
 * Retired demo webhook. Provider-specific signed endpoints are the only
 * supported payment callbacks. Keeping an explicit 410 prevents old clients
 * from silently believing an in-memory demo handler processed real money.
 */
export async function POST() {
  return NextResponse.json(
    { error: "Generic payment webhook retired; use the provider-specific legacy endpoint" },
    { status: 410 }
  );
}
