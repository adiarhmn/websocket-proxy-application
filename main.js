require("dotenv/config");
const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const PORT = process.env.PORT || 8000; // Sesuai Public URL Koyeb

const DA_USERNAME = process.env.DA_USERNAME;
const DA_PASSWORD = process.env.DA_PASSWORD;
const DA_HOST = process.env.DA_HOST;

// 1. Route Health Check (Express)
app.get("/", (req, res) => {
     res.status(200).send("WebSocket Proxy is Running via Express");
});

// 2. Buat Server HTTP dari App Express
const server = http.createServer(app);

// 3. Pasang WebSocket Server ke HTTP Server yang sama
const wss = new WebSocket.Server({ server });

wss.on("connection", (clientSocket, req) => {
     // console.log(`Koneksi baru dari: ${req.headers.origin}`);

     // Setup koneksi ke DirectAdmin
     const targetSocket = new WebSocket(DA_HOST, {
          headers: {
               Authorization:
                    "Basic " +
                    Buffer.from(`${DA_USERNAME}:${DA_PASSWORD}`).toString(
                         "base64",
                    ),
          },
     });

     // Proxy: Client Browser -> DirectAdmin
     clientSocket.on("message", (data) => {
          // console.log("Message received from client:", data.toString());
          if (targetSocket.readyState === WebSocket.OPEN) {
               targetSocket.send(data.toString());
          }
     });

     // Proxy: DirectAdmin -> Client Browser
     targetSocket.on("message", (data) => {
          if (clientSocket.readyState === WebSocket.OPEN) {
               clientSocket.send(data);
          }
     });

     // Handle Close & Error
     const cleanup = () => {
          clientSocket.close();
          targetSocket.close();
     };

     targetSocket.on("close", cleanup);
     clientSocket.on("close", cleanup);
     targetSocket.on("error", (e) => console.error("DA Error:", e.message));
     clientSocket.on("error", (e) => console.error("Client Error:", e.message));
});

// 4. Jalankan Server
server.listen(PORT, () => {
     console.log(`Express & WS Server running on port ${PORT}`);
});
