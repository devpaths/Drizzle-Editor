// @ts-ignore
import express, { Request, Response } from "express";
import { createServer } from "http";
// @ts-ignore
import cors from "cors";
import { WebSocketServer } from "ws";
// @ts-ignore
const setupWSConnection = require("y-websocket/bin/utils").setupWSConnection;

/**
 * CORSConfiguration
 */
export const allowedOrigins = ["http://localhost:5173"];

/**
 * Server INITIALIZATION and CONFIGURATION
 * CORS configuration
 * Request body parsing
 */
const app = express();
app.use(
  cors({
    origin: allowedOrigins,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: "Content-Type",
    credentials: true,
  }),
);
app.use(express.json());

/**
 * Create an http server
 */
export const httpServer = createServer(app);

/**
 * Create a wss (Web Socket Secure) server
 */
export const wss = new WebSocketServer({ server: httpServer });

// @ts-ignore
function onError(error) {
  console.log("Error:", error);
}

function onListening() {
  console.log("Listening");
}

httpServer.on("error", onError);
httpServer.on("listening", onListening);

/**
 * On connection, use the utility file provided by y-websocket
 */
wss.on("connection", (ws, req) => {
  console.log("wss: connection established");
  setupWSConnection(ws, req);
});
