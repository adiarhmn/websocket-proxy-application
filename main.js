require('dotenv/config');
const WebSocket = require('ws');
const http = require('http');

// Ambil env variable
const WS_PORT = process.env.PORT || 8080;       // Port WebSocket
const HEALTH_PORT = process.env.HEALTH_PORT || 8081; // Port health check
const DA_USERNAME = process.env.USERNAME;
const DA_PASSWORD = process.env.PASSWORD;
const DA_HOST = process.env.DA_HOST || "wss://hosting.batuah.tech:2222/api/terminal?cols=114&rows=28";

// ===== HTTP Health Check =====
http.createServer((req, res) => {
  res.writeHead(200);
  res.end("OK");
}).listen(HEALTH_PORT, () => console.log(`Health check listening on ${HEALTH_PORT}`));

// ===== WebSocket Proxy =====
const wss = new WebSocket.Server({ port: WS_PORT });
console.log(`WebSocket proxy listening on ${WS_PORT}`);

wss.on("connection", (clientSocket) => {
  console.log("Client connected");

  // Connect to DirectAdmin WS
  const targetSocket = new WebSocket(DA_HOST, {
    headers: {
      Authorization:
        "Basic " + Buffer.from(`${DA_USERNAME}:${DA_PASSWORD}`).toString("base64"),
    },
  });

  let isReady = false;

  targetSocket.on("open", () => {
    isReady = true;
    console.log("Connected to DirectAdmin WS");
  });

  // Client → DirectAdmin
  clientSocket.on("message", (msg) => {
    if (isReady && targetSocket.readyState === WebSocket.OPEN) {
      targetSocket.send(msg.toString());
    }
  });

  // DirectAdmin → Client
  targetSocket.on("message", (msg) => {
    clientSocket.send(msg);
  });

  targetSocket.on("close", () => {
    console.log("DirectAdmin WS closed");
    clientSocket.close();
  });

  targetSocket.on("error", (err) => {
    console.error("DirectAdmin WS error:", err.message);
    clientSocket.close();
  });

  clientSocket.on("close", () => {
    targetSocket.close();
  });

  clientSocket.on("error", (err) => {
    console.error("Client WS error:", err.message);
    targetSocket.close();
  });
});
