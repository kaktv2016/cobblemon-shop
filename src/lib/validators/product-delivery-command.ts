import { z } from "zod";

export const DELIVERY_PLACEHOLDERS = [
  "player_name",
  "player_uuid",
  "order_id",
  "product_id",
  "product_slug",
  "delivery_key",
  "delivery_amount",
  "quantity",
] as const;

function hasOnlyKnownPlaceholders(command: string) {
  return [...command.matchAll(/\{(\w+)\}/g)].every((match) =>
    DELIVERY_PLACEHOLDERS.includes(match[1] as (typeof DELIVERY_PLACEHOLDERS)[number])
  );
}

export const productDeliveryCommandSchema = z
  .object({
    kind: z.enum(["TEMPLATE", "CUSTOM"]),
    templateId: z.string().trim().optional().nullable(),
    commandTemplate: z.string().trim().max(5000).optional().nullable(),
  })
  .superRefine((value, context) => {
    if (value.kind === "TEMPLATE" && !value.templateId) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["templateId"], message: "Select a delivery template" });
    }
    if (value.kind === "CUSTOM") {
      if (!value.commandTemplate) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ["commandTemplate"], message: "Enter an RCON command" });
      } else if (/[\r\n\0]/.test(value.commandTemplate)) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ["commandTemplate"], message: "Each RCON command must be a single line" });
      } else if (!hasOnlyKnownPlaceholders(value.commandTemplate)) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ["commandTemplate"], message: `Unknown placeholder. Allowed: ${DELIVERY_PLACEHOLDERS.join(", ")}` });
      }
    }
  });

export const productDeliveryCommandsSchema = z.array(productDeliveryCommandSchema).max(25);
export type ProductDeliveryCommandInput = z.infer<typeof productDeliveryCommandSchema>;
