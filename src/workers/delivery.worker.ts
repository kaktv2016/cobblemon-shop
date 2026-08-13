import { loadEnvConfig } from "@next/env";

const productionMode = process.argv.includes("--production");
if (productionMode) Reflect.set(process.env, "NODE_ENV", "production");
loadEnvConfig(process.cwd(), !productionMode);

const POLL_INTERVAL_MS = 5_000;
let stopping = false;
let wakeTimer: NodeJS.Timeout | undefined;
let wakePoll: (() => void) | undefined;

function waitForNextPoll() {
  return new Promise<void>((resolve) => {
    wakePoll = resolve;
    wakeTimer = setTimeout(() => {
      wakePoll = undefined;
      resolve();
    }, POLL_INTERVAL_MS);
  });
}

async function run() {
  const [{ DeliveryService }, { prisma }] = await Promise.all([
    import("@/lib/services/delivery.service"),
    import("@/lib/prisma"),
  ]);

  const shutdown = (signal: string) => {
    if (stopping) return;
    stopping = true;
    if (wakeTimer) clearTimeout(wakeTimer);
    console.log(`[delivery-worker] ${signal} received, shutting down...`);
    wakePoll?.();
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));

  console.log(`[delivery-worker] Started in ${process.env.DELIVERY_MODE || "dry-run"} mode`);

  const recovered = await DeliveryService.recoverStaleProcessingJobs();
  if (recovered > 0) {
    console.warn(`[delivery-worker] Flagged ${recovered} stale job(s) for manual review`);
  }

  while (!stopping) {
    try {
      const result = await DeliveryService.processQueue(10);
      if (result.processed > 0) {
        console.log(
          `[delivery-worker] Processed ${result.processed}: ${result.succeeded} delivered, ${result.failed} deferred/failed`
        );
      }
    } catch (error) {
      console.error("[delivery-worker] Queue poll failed:", error);
    }

    if (!stopping) await waitForNextPoll();
  }

  await prisma.$disconnect();
  console.log("[delivery-worker] Stopped cleanly");
}

run().catch((error) => {
  console.error("[delivery-worker] Fatal error:", error);
  process.exitCode = 1;
});
