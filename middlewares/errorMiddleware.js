// module.exports = (err, req, res, next) => {
//   console.error(err.message);
//   res.status(500).send("Something went wrong");
// };



// middlewares/errorMiddleware.js
//
// Same role as your original (global error handler at the bottom of the
// middleware stack), extended to:
//   - use the shared logger instead of a bare console.error, so logs follow
//     one consistent format everywhere
//   - respect a custom err.statusCode if a controller set one, instead of
//     always sending 500
//   - send JSON for API/test clients, plain text for browser requests
//     (keeps your original behaviour for the browser case)

const logger = require("../utils/logger");

module.exports = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  logger.error(err.message, {
    statusCode,
    path: req.originalUrl,
    method: req.method,
  });

  const wantsJSON =
    req.headers.accept?.includes("application/json") ||
    req.originalUrl.startsWith("/api");

  const safeMessage = statusCode === 500 ? "Something went wrong" : err.message;

  if (wantsJSON) {
    return res.status(statusCode).json({ success: false, message: safeMessage });
  }
  res.status(statusCode).send(safeMessage);
};
