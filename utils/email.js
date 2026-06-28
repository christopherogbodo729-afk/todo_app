// utils/email.js
//
// MOCK email sender - no real SMTP/provider wired up. Logs what would be
// sent. Swap the body of sendOverdueEmail() for a real provider later
// (Nodemailer, SendGrid, etc.) - nothing else in the app needs to change.

const logger = require("../utils/logger");

async function sendOverdueEmail(user, task) {
  const recipient = user.email || `${user.username} (no email on file)`;

  logger.info("[MOCK EMAIL] Overdue task notification", {
    to: recipient,
    subject: `Task overdue: "${task.title}"`,
    body: `Hi ${user.username}, your task "${task.title}" was due on ${task.dueDate.toISOString()} and is now overdue.`,
  });

  return true;
}

module.exports = { sendOverdueEmail };