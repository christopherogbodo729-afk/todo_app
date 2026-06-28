// utils/logger.js
//
// Small consistent-format logger so every log line looks like:
//   [2026-06-28 10:15:32] INFO: message {extra:"data"}
// Your original used morgan for HTTP request logs (kept in app.js) and
// console.error for errors - this just gives the error/info logs the same
// timestamp + level format that morgan already uses for requests.

function timestamp() {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

function format(level, message, meta) {
  const metaStr =
    meta && Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
  return `[${timestamp()}] ${level}: ${message}${metaStr}`;
}

module.exports = {
  info: (message, meta) => console.log(format("INFO", message, meta)),
  warn: (message, meta) => console.warn(format("WARN", message, meta)),
  error: (message, meta) => console.error(format("ERROR", message, meta)),
};
