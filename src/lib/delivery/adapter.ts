/**
 * Delivery Adapter Interface
 *
 * Defines the contract for delivery mechanisms (webhooks, RCON, dry-run, etc.)
 * Allows flexible switching between delivery implementations in production and testing.
 */

export interface DeliveryResult {
  success: boolean;
  response?: string;
  error?: string;
}

export interface DeliveryContext {
  playerName: string;
  playerUuid: string;
  orderId: string;
  isDryRun: boolean;
}

export interface DeliveryAdapter {
  /**
   * Human-readable name of the adapter
   */
  name: string;

  /**
   * Execute a delivery command (e.g., give item, spawn Pokemon)
   * @param command The command to execute (format depends on adapter)
   * @param context Contextual information about the delivery
   * @returns Result of delivery attempt
   */
  execute(command: string, context: DeliveryContext): Promise<DeliveryResult>;
}

/**
 * Factory function to get the appropriate delivery adapter based on environment
 *
 * Environment variables:
 * - DELIVERY_MODE: 'dry-run' | 'webhook' | 'rcon' (default: 'dry-run')
 * - WEBHOOK_DELIVERY_URL: URL for webhook deliveries
 * - WEBHOOK_SECRET: Secret for webhook signing
 * - RCON_HOST: Host for RCON connection
 * - RCON_PORT: Port for RCON connection
 * - RCON_PASSWORD: Password for RCON authentication
 */
export function getDeliveryAdapter(): DeliveryAdapter {
  const mode = (process.env.DELIVERY_MODE || 'dry-run').toLowerCase();

  switch (mode) {
    case 'webhook':
      // Lazy load to avoid import errors if dependencies aren't installed
      const { WebhookDeliveryAdapter } = require('./webhook');
      return new WebhookDeliveryAdapter();

    case 'rcon':
      // Lazy load to avoid import errors if dependencies aren't installed
      const { RconDeliveryAdapter } = require('./rcon');
      return new RconDeliveryAdapter();

    case 'dry-run':
    default:
      // Lazy load to avoid import errors if dependencies aren't installed
      const { DryRunDeliveryAdapter } = require('./dry-run');
      return new DryRunDeliveryAdapter();
  }
}
