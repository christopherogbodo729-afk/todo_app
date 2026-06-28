// utils/wsManager.js
//
// Manages WebSocket connections and makes sure notifications only ever
// reach the user who owns the task.
//
// Auth: client connects to ws://host/?token=<JWT>. We verify that token
// with the exact same verifyToken() used by authMiddleware.js for regular
// HTTP routes - this is "the same JWT token" the assignment asks for.
//
// Offline users: we keep an in-memory Map of userId -> Set of open
// sockets. If a user has no entry (or all their sockets are closed),
// sendToUser() just does nothing - the notification is skipped, but the
// task's state change is still saved in MongoDB, so a reconnecting user
// sees the correct status once they re-fetch their tasks. We deliberately
// do NOT queue missed notifications for later delivery.

const WebSocket = require("ws");
const { verifyToken } = require("./jwt");
const logger = require("./logger");

// userId (string) -> Set<WebSocket>
const userSockets = new Map();

function initWebSocketServer(server) {
  const wss = new WebSocket.Server({ server });

  wss.on("connection", (ws, req) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = url.searchParams.get("token");

      if (!token) {
        logger.warn("WebSocket connection rejected: no token provided");
        ws.close(4001, "Authentication required");
        return;
      }

      const decoded = verifyToken(token);
      const userId = decoded.id;

      ws.userId = userId;
      registerSocket(userId, ws);

      logger.info("WebSocket client connected", { userId });

      ws.on("close", () => {
        unregisterSocket(userId, ws);
        logger.info("WebSocket client disconnected", { userId });
      });

      ws.on("error", (err) => {
        logger.error("WebSocket error", { userId, error: err.message });
      });

      ws.send(
        JSON.stringify({
          type: "connected",
          message: "WebSocket authenticated successfully",
        }),
      );
    } catch (err) {
      logger.warn("WebSocket connection rejected: invalid token", {
        error: err.message,
      });
      ws.close(4002, "Invalid or expired token");
    }
  });

  logger.info("WebSocket server initialized");
  return wss;
}

function registerSocket(userId, ws) {
  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
  }
  userSockets.get(userId).add(ws);
}

function unregisterSocket(userId, ws) {
  const sockets = userSockets.get(userId);
  if (!sockets) return;
  sockets.delete(ws);
  if (sockets.size === 0) {
    userSockets.delete(userId);
  }
}

// Sends to every open socket belonging to one user. Silently does nothing
// if that user has no open sockets (offline) - see note above.
function sendToUser(userId, payload) {
  const sockets = userSockets.get(String(userId));
  if (!sockets || sockets.size === 0) {
    logger.info(
      "No active WebSocket for user, skipping realtime notification",
      { userId },
    );
    return false;
  }

  const message = JSON.stringify(payload);
  let sentCount = 0;

  for (const ws of sockets) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
      sentCount++;
    }
  }

  logger.info("Realtime notification sent", {
    userId,
    type: payload.type,
    sentCount,
  });
  return sentCount > 0;
}

module.exports = { initWebSocketServer, sendToUser };
