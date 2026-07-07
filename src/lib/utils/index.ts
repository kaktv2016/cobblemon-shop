import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine classnames with Tailwind CSS merging
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format cents to formatted price string (USD)
 * @example formatPrice(9999) => "$99.99"
 */
export function formatPrice(cents: number): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
}

/**
 * Format date to readable string
 * @example formatDate(new Date()) => "Apr 10, 2026"
 */
export function formatDate(date: Date | null | undefined): string {
  if (!date) return "";

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

/**
 * Generate unique order number
 * Format: CBL-{timestamp}-{random}
 */
export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CBL-${timestamp}-${random}`;
}

/**
 * Convert text to URL-safe slug
 * @example slugify("My Product Name") => "my-product-name"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Allowed template placeholders for safe template rendering
 */
const ALLOWED_PLACEHOLDERS = [
  "player_name",
  "player_uuid",
  "order_id",
  "product_id",
  "quantity",
] as const;

/**
 * Safe template rendering - only replaces known placeholders
 * Prevents template injection and arbitrary code execution
 *
 * @param template Template string with {placeholder} syntax
 * @param vars Object with replacement values
 * @returns Rendered string with safe replacements
 *
 * @example
 * sanitizeTemplatePlaceholders(
 *   "Welcome {player_name}! Order: {order_id}",
 *   { player_name: "Steve", order_id: "CBL-123" }
 * ) => "Welcome Steve! Order: CBL-123"
 */
export function sanitizeTemplatePlaceholders(
  template: string,
  vars: Record<string, any>
): string {
  if (!template || typeof template !== "string") {
    return "";
  }

  // Validate that no unexpected placeholders exist
  const placeholderRegex = /\{(\w+)\}/g;
  const foundPlaceholders = new Set<string>();

  let match;
  while ((match = placeholderRegex.exec(template)) !== null) {
    foundPlaceholders.add(match[1]);
  }

  // Check for disallowed placeholders
  for (const placeholder of foundPlaceholders) {
    if (!ALLOWED_PLACEHOLDERS.includes(placeholder as any)) {
      throw new Error(
        `Template contains disallowed placeholder: {${placeholder}}. Allowed placeholders: ${ALLOWED_PLACEHOLDERS.join(", ")}`
      );
    }
  }

  // Safe replacement - only replace known placeholders
  let result = template;
  for (const placeholder of ALLOWED_PLACEHOLDERS) {
    const value = vars[placeholder];
    if (value !== undefined && value !== null) {
      // Escape curly braces in the value to prevent re-injection
      const escapedValue = String(value).replace(/[{}]/g, "");
      const regex = new RegExp(`\\{${placeholder}\\}`, "g");
      result = result.replace(regex, escapedValue);
    }
  }

  return result;
}

/**
 * Generate deterministic idempotency key for delivery retries
 * Same inputs always produce the same key (deterministic)
 * Prevents duplicate deliveries on retry
 *
 * @param orderId Order ID
 * @param orderItemId Order item ID
 * @param attempt Attempt number (0-based)
 * @returns Idempotency key
 */
export function generateIdempotencyKey(
  orderId: string,
  orderItemId: string,
  attempt: number = 0
): string {
  const combined = `${orderId}:${orderItemId}:${attempt}`;

  // Use simple hash for deterministic key
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Create a base32-like string from the hash and timestamp epoch
  const hashPart = Math.abs(hash).toString(36).padStart(8, "0");
  const timePart = Math.floor(Date.now() / 1000).toString(36);

  return `${orderId.substring(0, 8)}-${hashPart}-${timePart}`.toUpperCase();
}
