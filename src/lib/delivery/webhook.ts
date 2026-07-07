/**
 * Webhook Delivery Adapter
 *
 * Sends delivery commands to a remote webhook endpoint.
 * Includes HMAC-SHA256 signature for authentication.
 * Suitable for custom server integrations and modded Minecraft setups.
 */

import crypto from 'crypto';
import { DeliveryAdapter, DeliveryResult, DeliveryContext } from './adapter';

interface WebhookPayload {
  command: string;
  playerName: string;
  playerUuid: string;
  orderId: string;
  timestamp: string;
  signature: string;
}

export class WebhookDeliveryAdapter implements DeliveryAdapter {
  name = 'Webhook Delivery';

  private webhookUrl: string;
  private webhookSecret: string;
  private timeout: number = 10000; // 10 seconds

  constructor() {
    this.webhookUrl = process.env.WEBHOOK_DELIVERY_URL || '';
    this.webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET || '';

    if (!this.webhookUrl) {
      throw new Error(
        'WEBHOOK_DELIVERY_URL environment variable is required for webhook delivery adapter'
      );
    }

    if (!this.webhookSecret) {
      throw new Error(
        'PAYMENT_WEBHOOK_SECRET environment variable is required for webhook signature verification'
      );
    }

    // Validate URL
    try {
      new URL(this.webhookUrl);
    } catch (error) {
      throw new Error(`Invalid WEBHOOK_DELIVERY_URL: ${this.webhookUrl}`);
    }
  }

  /**
   * Execute a delivery command via webhook
   */
  async execute(command: string, context: DeliveryContext): Promise<DeliveryResult> {
    // Validate inputs
    if (!command || command.trim().length === 0) {
      return {
        success: false,
        error: 'Command cannot be empty',
      };
    }

    if (!context.playerName || context.playerName.trim().length === 0) {
      return {
        success: false,
        error: 'Player name is required',
      };
    }

    if (!context.playerUuid || context.playerUuid.trim().length === 0) {
      return {
        success: false,
        error: 'Player UUID is required',
      };
    }

    const timestamp = new Date().toISOString();
    const payload: Omit<WebhookPayload, 'signature'> = {
      command,
      playerName: context.playerName,
      playerUuid: context.playerUuid,
      orderId: context.orderId,
      timestamp,
    };

    // Create signature
    const signature = this.createSignature(payload);

    const webhookPayload: WebhookPayload = {
      ...payload,
      signature,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Cobblemon-Signature': signature,
          'X-Cobblemon-Timestamp': timestamp,
        },
        body: JSON.stringify(webhookPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 200) {
        return {
          success: true,
          response: `Command delivered to webhook: ${this.webhookUrl}`,
        };
      }

      const responseText = await response.text();
      return {
        success: false,
        error: `Webhook returned status ${response.status}: ${responseText}`,
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: `Webhook request timeout after ${this.timeout}ms`,
          };
        }

        return {
          success: false,
          error: `Webhook request failed: ${error.message}`,
        };
      }

      return {
        success: false,
        error: 'Webhook request failed with unknown error',
      };
    }
  }

  /**
   * Create HMAC-SHA256 signature for webhook payload
   * @param payload The payload to sign
   * @returns Hex-encoded signature
   */
  private createSignature(payload: Omit<WebhookPayload, 'signature'>): string {
    const bodyString = JSON.stringify(payload);
    return crypto
      .createHmac('sha256', this.webhookSecret)
      .update(bodyString)
      .digest('hex');
  }

  /**
   * Verify a webhook signature (used for incoming webhooks)
   * @param payload The payload to verify
   * @param signature The signature to check against
   * @returns Whether the signature is valid
   */
  static verifySignature(
    payload: Omit<WebhookPayload, 'signature'>,
    signature: string,
    secret: string
  ): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature)
    );
  }
}
