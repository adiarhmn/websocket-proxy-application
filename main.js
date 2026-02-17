require("dotenv").config();
const WebSocket = require("ws");

const username = process.env.USERNAME;
const password = process.env.PASSWORD;
const port = process.env.PORT || 8080;

const server = new WebSocket.Server({ port });
server.on("connection", function (clientSocket) {
     const targetSocket = new WebSocket("wss://batuah.tech:2222/api/terminal", {
          headers: {
               Authorization:
                    "Basic " +
                    Buffer.from(`${username}:${password}`).toString("base64"),
          },
     });

     let isReady = false;

     targetSocket.on("open", () => {
          isReady = true;
          const resizePayload = JSON.stringify({
               cols: 80,
               rows: 24,
          });
          targetSocket.send(Buffer.from(resizePayload));
     });

     clientSocket.on("message", function (msg) {
          console.log("Received message from client:", msg);
          if (isReady && targetSocket.readyState === WebSocket.OPEN) {
               targetSocket.send(msg.toString());
               console.log("Sent message to DirectAdmin:", msg);
          }
     });

     // 🔥 DirectAdmin → client
     targetSocket.on("message", function (msg) {
          console.log("Received message from DirectAdmin:", msg.toString());
          clientSocket.send(msg);
     });

     targetSocket.on("error", (err) => {
          console.log("Target error:", err.message);
     });
});
