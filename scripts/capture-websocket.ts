import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import WebSocket from "ws";

type CaptureConfig = {
  localIP: string;
  port?: number;
  path?: string;
  heartbeatIntervalMs?: number;
};

async function main() {
  const configPath = path.join(process.cwd(), "config", "velocidrone.json");
  let config: CaptureConfig;
  try {
    config = JSON.parse(await readFile(configPath, "utf8")) as CaptureConfig;
  } catch (error) {
    throw new Error(
      `Could not read ${configPath}. Copy config/velocidrone.example.json to config/velocidrone.json and fill it in.`,
      { cause: error },
    );
  }

  if (!config.localIP) {
    throw new Error(`localIP is required in ${configPath}`);
  }

  const websocketUrl = `ws://${config.localIP}:${config.port ?? 60003}${config.path ?? "/velocidrone"}`;
  const heartbeatIntervalMs = config.heartbeatIntervalMs ?? 10000;
  const outputPath = path.join(
    process.cwd(),
    "data",
    "websocket-messages.ndjson",
  );
  let reconnectDelay = 1000;
  let stopping = false;

  await mkdir(path.dirname(outputPath), { recursive: true });

  function connect() {
    const client = new WebSocket(websocketUrl);
    let heartbeatTimer: NodeJS.Timeout | undefined;

    client.on("open", () => {
      reconnectDelay = 1000;
      console.log(`Connected to ${websocketUrl}`);
      const heartbeat = () => client.send("");
      heartbeat();
      heartbeatTimer = setInterval(heartbeat, heartbeatIntervalMs);
    });

    client.on("message", async (data) => {
      const rawMessage = data.toString();
      if (!rawMessage) return;
      const record = {
        receivedAt: new Date().toISOString(),
        message: rawMessage,
      };
      await appendFile(outputPath, `${JSON.stringify(record)}\n`, "utf8");
      console.log(`Captured message (${rawMessage.length} bytes)`);
    });

    client.on("error", (error) => {
      console.error(`WebSocket error: ${error.message}`);
    });

    client.on("close", (code, reason) => {
      if (heartbeatTimer) clearInterval(heartbeatTimer);
      console.log(
        `Disconnected (${code}${reason.length ? `: ${reason}` : ""})`,
      );
      if (!stopping) {
        setTimeout(connect, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, 30000);
      }
    });
  }

  function stop() {
    stopping = true;
    process.exit(0);
  }

  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  connect();
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
