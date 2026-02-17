import { express } from "express";

const app = express();
app.use(express.json());

const webSocketServer = new WebSocket.Server({ port: 8080 });
const session = new Map();

webSocketServer.on("connection", (clientSocket, req) => {
     const url = new URL(req.url, `http://${req.headers.host}`);
     
     const sessionId = url.searchParams.get("sessionId");
     const sessionData = session.get(sessionId);
     if (!sessionData) {
          clientSocket.send("Failed to authenticate", { binary: true });
     } else {
          
          clientSocket.send("Authenticated", { binary: true });
     }
});

// app.post;