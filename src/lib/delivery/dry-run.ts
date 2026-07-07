/**
 * Dry Run Delivery Adapter
 *
 * Development and testing adapter that logs commands without executing them.
 * Useful for testing order flows and delivery logic without touching live systems.
 */

import { DeliveryAdapter, DeliveryResult, DeliveryContext } from './adapter';

export interface DryRunCommand {
  timestamp: Date;
  command: string;
  playerName: string;
  playerUuid: string;
  orderId: string;
}

export class DryRunDeliveryAdapter implements DeliveryAdapter {
  name = 'Dry Run (Development/Testing)';

  private static commands: DryRunCommand[] = [];

  /**
   * Execute a delivery command in dry-run mode
   * Logs the command and simulates a delay
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

    // Store the command for testing/verification
    const dryRunCommand: DryRunCommand = {
      timestamp: new Date(),
      command,
      playerName: context.playerName,
      playerUuid: context.playerUuid,
      orderId: context.orderId,
    };

    DryRunDeliveryAdapter.commands.push(dryRunCommand);

    // Log to console for visibility in development
    console.log('[DRY-RUN] Delivery Command:', {
      timestamp: dryRunCommand.timestamp.toISOString(),
      orderId: context.orderId,
      playerName: context.playerName,
      playerUuid: context.playerUuid,
      isDryRun: context.isDryRun,
      command: command,
    });

    // Simulate network delay
    await this.simulateDelay(100);

    return {
      success: true,
      response: `[DRY-RUN] Command would execute: ${command}`,
    };
  }

  /**
   * Get all commands executed in this session (for testing)
   */
  static getExecutedCommands(): DryRunCommand[] {
    return [...DryRunDeliveryAdapter.commands];
  }

  /**
   * Get the last command executed (useful for testing)
   */
  static getLastCommand(): DryRunCommand | undefined {
    return DryRunDeliveryAdapter.commands[DryRunDeliveryAdapter.commands.length - 1];
  }

  /**
   * Get commands for a specific order (useful for testing)
   */
  static getCommandsForOrder(orderId: string): DryRunCommand[] {
    return DryRunDeliveryAdapter.commands.filter((cmd) => cmd.orderId === orderId);
  }

  /**
   * Clear all commands (useful for resetting between tests)
   */
  static clearCommands(): void {
    DryRunDeliveryAdapter.commands = [];
  }

  /**
   * Simulate a command being completed (for testing payment flows)
   */
  static simulateCompletePayment(orderId: string): void {
    console.log(`[DRY-RUN] Simulating payment completion for order: ${orderId}`);
  }

  private simulateDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
