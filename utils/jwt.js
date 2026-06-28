// utils/jwt.js
//
// One place for signing/verifying JWTs. Both authMiddleware.js (HTTP routes)
// and wsManager.js (WebSocket handshake) call verifyToken() from here — this
// is what makes it "the same JWT token" across REST and WebSocket, as the
// assignment requires.

const jwt = require("jsonwebtoken");

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function verifyToken(token) {
  // Throws if invalid/expired - callers must try/catch
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = { signToken, verifyToken };
