// utils/overdueChecker.js
//
// Runs every minute. Finds 'pending' tasks whose dueDate has passed,
// flips them to 'overdue', and fires both a real-time WebSocket
// notification (only reaches the owner, only if they're connected) and
// a mocked email notification.
//
// notifiedOverdue on the Task model makes sure each task only ever
// triggers ONE notification, even though this runs every minute.

const cron = require("node-cron");
const Task = require("../models/task");
const logger = require("./logger");
const { sendToUser } = require("./Wsmanager");
const { sendOverdueEmail } = require("./email");

async function checkOverdueTasks() {
  try {
    const now = new Date();

    const overdueTasks = await Task.find({
      status: "pending",
      dueDate: { $ne: null, $lt: now },
      notifiedOverdue: false,
    }).populate("user", "username email");

    if (overdueTasks.length === 0) return;

    logger.info("Overdue check found tasks to process", { count: overdueTasks.length });

    for (const task of overdueTasks) {
      task.status = "overdue";
      task.notifiedOverdue = true;
      await task.save();

      const owner = task.user; // populated User document

      sendToUser(String(owner._id), {
        type: "task_overdue",
        task: { id: task._id, title: task.title, dueDate: task.dueDate, status: task.status },
        message: `Your task "${task.title}" is now overdue.`,
      });

      await sendOverdueEmail(owner, task);
    }
  } catch (err) {
    logger.error("Error while checking overdue tasks", { error: err.message });
  }
}

function startOverdueCron() {
  cron.schedule("* * * * *", checkOverdueTasks);
  logger.info("Overdue task cron job scheduled (runs every minute)");
}

module.exports = { startOverdueCron, checkOverdueTasks };