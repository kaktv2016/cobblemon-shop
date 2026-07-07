import { z } from "zod";

/**
 * Allowed placeholders in delivery templates
 */
const ALLOWED_PLACEHOLDERS = [
  "player_name",
  "player_uuid",
  "order_id",
  "product_id",
  "quantity",
];

/**
 * Regex to find all placeholders in a string
 * Matches {placeholder} pattern
 */
const PLACEHOLDER_REGEX = /\{(\w+)\}/g;

/**
 * Validate that template only contains allowed placeholders
 */
function validateTemplateContent(template: string): boolean {
  const placeholders = new Set<string>();
  let match;

  const regex = new RegExp(PLACEHOLDER_REGEX);
  while ((match = regex.exec(template)) !== null) {
    placeholders.add(match[1]);
  }

  // Check if all found placeholders are in the allowed list
  for (const placeholder of placeholders) {
    if (!ALLOWED_PLACEHOLDERS.includes(placeholder)) {
      return false;
    }
  }

  return true;
}

/**
 * Create delivery template schema
 */
export const createDeliveryTemplateSchema = z.object({
  name: z
    .string()
    .min(1, "Template name is required")
    .max(256, "Template name must be at most 256 characters"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(1000, "Description must be at most 1000 characters")
    .optional()
    .nullable(),
  commandTemplate: z
    .string()
    .min(1, "Command template is required")
    .max(5000, "Command template must be at most 5000 characters")
    .refine(
      (val) => validateTemplateContent(val),
      {
        message: `Template contains disallowed placeholders. Allowed placeholders: {${ALLOWED_PLACEHOLDERS.join("}, {")}}`,
      }
    ),
  adapterType: z.enum(["BUKKIT", "SPIGOT", "PAPER", "FABRIC", "FORGE"]),
  isActive: z.boolean().default(true),
});

export type CreateDeliveryTemplateInput = z.infer<typeof createDeliveryTemplateSchema>;

/**
 * Update delivery template schema
 */
export const updateDeliveryTemplateSchema = z.object({
  name: z
    .string()
    .min(1, "Template name is required")
    .max(256, "Template name must be at most 256 characters")
    .optional(),
  description: z
    .string()
    .min(1, "Description is required")
    .max(1000, "Description must be at most 1000 characters")
    .optional()
    .nullable(),
  commandTemplate: z
    .string()
    .min(1, "Command template is required")
    .max(5000, "Command template must be at most 5000 characters")
    .refine(
      (val) => validateTemplateContent(val),
      {
        message: `Template contains disallowed placeholders. Allowed placeholders: {${ALLOWED_PLACEHOLDERS.join("}, {")}}`,
      }
    )
    .optional(),
  adapterType: z
    .enum(["BUKKIT", "SPIGOT", "PAPER", "FABRIC", "FORGE"])
    .optional(),
  isActive: z.boolean().optional(),
});

export type UpdateDeliveryTemplateInput = z.infer<typeof updateDeliveryTemplateSchema>;
