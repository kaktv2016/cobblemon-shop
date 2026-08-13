import { Rcon } from "rcon-client";
import type {
  DeliveryAdapter,
  DeliveryContext,
  DeliveryResult,
} from "./adapter";

interface RconConfig {
  host: string;
  port: number;
  password: string;
  timeout: number;
}

const FAILURE_PATTERNS = [
  /unknown (?:or incomplete )?command/i,
  /incorrect argument/i,
  /no player was found/i,
  /player .* not found/i,
  /cannot find player/i,
  /requires (?:a )?player/i,
  /exception|error executing/i,
];

const CONNECT_RETRY_DELAYS_MS = [0, 500, 1500];

// Minecraft RCON servers are generally reliable with one request at a time.
// Serialize connections across delivery jobs in this Node.js process.
let rconExecutionQueue: Promise<void> = Promise.resolve();

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function runExclusive<T>(operation: () => Promise<T>): Promise<T> {
  const result = rconExecutionQueue.then(operation, operation);
  rconExecutionQueue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
  if (!value) return fallback;

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid positive integer: ${value}`);
  }

  return parsed;
}

export class RconDeliveryAdapter implements DeliveryAdapter {
  name = "RCON (Minecraft Server)";

  private readonly config: RconConfig;

  constructor() {
    const host = process.env.RCON_HOST?.trim();
    const password = process.env.RCON_PASSWORD;

    if (!host) {
      throw new Error("RCON_HOST environment variable is required");
    }

    if (!password) {
      throw new Error("RCON_PASSWORD environment variable is required");
    }

    const port = parsePositiveInteger(process.env.RCON_PORT, 25575);
    if (port > 65535) {
      throw new Error("RCON_PORT must be between 1 and 65535");
    }

    this.config = {
      host,
      port,
      password,
      timeout: parsePositiveInteger(process.env.RCON_TIMEOUT_MS, 5000),
    };
  }

  async execute(command: string, context: DeliveryContext): Promise<DeliveryResult> {
    const playerName = context.playerName.trim();
    if (!/^[A-Za-z0-9_]{3,16}$/.test(playerName)) {
      return { success: false, error: "Invalid Minecraft username" };
    }

    const normalizedCommand = command.trim().replace(/^\/+/, "");
    if (!normalizedCommand || /[\r\n\0]/.test(normalizedCommand)) {
      return { success: false, error: "RCON command must be a single non-empty line" };
    }

    return runExclusive(() => this.executeExclusive(normalizedCommand, playerName));
  }

  private async connectWithRetry() {
    let lastError: unknown;

    for (const delay of CONNECT_RETRY_DELAYS_MS) {
      if (delay > 0) await wait(delay);

      try {
        return await Rcon.connect({
          host: this.config.host,
          port: this.config.port,
          password: this.config.password,
          timeout: this.config.timeout,
          maxPending: 1,
        });
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error("Unable to connect to Minecraft RCON");
  }

  private async executeExclusive(
    normalizedCommand: string,
    playerName: string
  ): Promise<DeliveryResult> {
    let connection: Rcon | undefined;

    try {
      connection = await this.connectWithRetry();
    } catch (error) {
      return {
        success: false,
        kind: "connection",
        error: error instanceof Error ? error.message : "Unable to connect to Minecraft RCON",
      };
    }

    try {
      let listResponse: string;
      try {
        listResponse = await connection.send("list");
      } catch (error) {
        return {
          success: false,
          kind: "connection",
          error: error instanceof Error ? error.message : "Unable to query online players",
        };
      }

      const onlinePlayers = this.parseOnlinePlayers(listResponse);
      if (!onlinePlayers.some((name) => name.toLowerCase() === playerName.toLowerCase())) {
        return {
          success: false,
          kind: "offline",
          error: `Player ${playerName} is offline`,
        };
      }

      let response: string;
      try {
        response = await connection.send(normalizedCommand);
      } catch (error) {
        // The command may already have executed. Never retry this automatically.
        return {
          success: false,
          kind: "unknown",
          error: error instanceof Error ? error.message : "RCON response was lost after command send",
        };
      }

      if (FAILURE_PATTERNS.some((pattern) => pattern.test(response))) {
        return {
          success: false,
          kind: "command_rejected",
          error: response || "Minecraft server rejected the command",
        };
      }

      return {
        success: true,
        response: response || "Command accepted by Minecraft RCON",
      };
    } finally {
      await connection.end().catch(() => undefined);
    }
  }

  private parseOnlinePlayers(response: string) {
    const separator = response.indexOf(":");
    if (separator === -1) return [];

    return response
      .slice(separator + 1)
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);
  }
}
