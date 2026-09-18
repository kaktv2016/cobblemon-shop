import { beforeEach, describe, expect, it } from "vitest";
import { DryRunDeliveryAdapter } from "@/lib/delivery/dry-run";

describe("dry-run multi-command delivery", () => {
  beforeEach(() => DryRunDeliveryAdapter.clearCommands());

  it("records three commands in execution order without requiring a UUID", async () => {
    const adapter = new DryRunDeliveryAdapter();
    const context = {
      playerName: "Steve",
      orderId: "order-1",
      isDryRun: true,
    };

    for (const command of ["plugin first Steve", "plugin second Steve", "plugin third Steve"]) {
      expect((await adapter.execute(command, context)).success).toBe(true);
    }

    expect(DryRunDeliveryAdapter.getCommandsForOrder("order-1").map((entry) => entry.command)).toEqual([
      "plugin first Steve",
      "plugin second Steve",
      "plugin third Steve",
    ]);
  });
});
