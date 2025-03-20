// websocket-server.js
import { WebSocketServer } from "ws";

// Create a simple WebSocket server compatible with y-websocket
const port = 8080;
const wss = new WebSocketServer({ port });

// Map to track clients by document
const rooms = new Map();

wss.on("connection", (ws, req) => {
  // Get the document ID from the URL path
  // (e.g., ws://localhost:8080/my-room-id)
  const url = new URL(req.url, "http://localhost:8080");
  const roomId = url.pathname.slice(1);

  console.log(`Client connected to room: ${roomId}`);

  // Add to room
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }
  const room = rooms.get(roomId);
  room.add(ws);

  // Store the room ID on the websocket object
  ws.roomId = roomId;

  // Broadcast messages to all clients in the same room
  ws.on("message", (message) => {
    const room = rooms.get(ws.roomId);
    if (room) {
      room.forEach((client) => {
        if (client !== ws && client.readyState === WebSocketServer.OPEN) {
          client.send(message);
        }
      });
    }
  });

  // Handle disconnection
  ws.on("close", () => {
    console.log(`Client disconnected from room: ${ws.roomId}`);
    const room = rooms.get(ws.roomId);
    if (room) {
      room.delete(ws);
      if (room.size === 0) {
        rooms.delete(ws.roomId);
        console.log(`Room ${ws.roomId} is now empty`);
      }
    }
  });
});

console.log(`WebSocket server is running on ws://localhost:8080`);
