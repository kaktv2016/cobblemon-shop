import { describe, expect, it } from "vitest";
import { productDeliveryCommandsSchema } from "@/lib/validators/product-delivery-command";
import { generateDeliveryIdempotencyKey, renderDeliveryTemplate } from "@/lib/services/delivery.service";

describe("delivery commands", () => {
  it("allows arbitrary plugin commands with allow-listed placeholders", () => {
    const result = productDeliveryCommandsSchema.safeParse([
      { kind: "CUSTOM", commandTemplate: "newplugin grant {player_name} legendary 2" },
      { kind: "TEMPLATE", templateId: "template-1" },
    ]);
    expect(result.success).toBe(true);
  });

  it("rejects unknown placeholders and multiline commands", () => {
    expect(productDeliveryCommandsSchema.safeParse([
      { kind: "CUSTOM", commandTemplate: "give {unknown}" },
    ]).success).toBe(false);
    expect(productDeliveryCommandsSchema.safeParse([
      { kind: "CUSTOM", commandTemplate: "first\nsecond" },
    ]).success).toBe(false);
  });

  it("renders snapshots and creates a distinct key for each sequence", () => {
    expect(renderDeliveryTemplate("plugin grant {player_name} {quantity}", {
      player_name: "Steve",
      quantity: 3,
    })).toBe("plugin grant Steve 3");
    expect(generateDeliveryIdempotencyKey("item-1", 0)).not.toBe(
      generateDeliveryIdempotencyKey("item-1", 1)
    );
    expect(generateDeliveryIdempotencyKey("item-1", 0)).toBe(
      generateDeliveryIdempotencyKey("item-1", 0)
    );
  });
});
