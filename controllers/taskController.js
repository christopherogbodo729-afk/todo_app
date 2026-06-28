// const Task = require("../models/Task");

// exports.createTask = async (req, res, next) => {
//   try {
//     await Task.create({
//       title: req.body.title,
//       user: req.session.userId,
//     });

//     res.redirect("/dashboard");
//   } catch (err) {
//     next(err);
//   }
// };

// exports.getTasks = async (req, res, next) => {
//   try {
//     const tasks = await Task.find({ user: req.session.userId });
//     res.render("dashboard", { tasks });
//   } catch (err) {
//     next(err);
//   }
// };

// exports.updateTask = async (req, res, next) => {
//   try {
//     await Task.findByIdAndUpdate(req.params.id, {
//       status: req.body.status,
//     });

//     res.redirect("/dashboard");
//   } catch (err) {
//     next(err);
//   }
// };


// controllers/taskController.js
//
// Same shape as your original (createTask, getTasks, updateTask), with:
//   - dueDate accepted on create
//   - getTasks supports an optional ?status= filter, and excludes
//     'deleted' tasks by default
//   - updateTask now fires a real-time WebSocket notification to the
//     owner when a task is marked completed
//   - req.session.userId replaced with req.userId (set by the new
//     JWT-based authMiddleware)
//   - ownership is checked explicitly, so one user can never update
//     another user's task

const Task = require("../models/task");
const { sendToUser } = require("../utils/Wsmanager");

exports.createTask = async (req, res, next) => {
  try {
    const { title, dueDate } = req.body;

    if (!title || title.trim().length === 0) {
      return res.redirect("/dashboard"); // could also re-render with an error if you add a flash message later
    }

    await Task.create({
      title: title.trim(),
      dueDate: dueDate ? new Date(dueDate) : null,
      user: req.userId,
    });

    res.redirect("/dashboard");
  } catch (err) {
    next(err);
  }
};

exports.getTasks = async (req, res, next) => {
  try {
    const filter = req.query.status;
    const query = { user: req.userId };

    if (filter && ["pending", "completed", "overdue", "deleted"].includes(filter)) {
      query.status = filter;
    } else {
      query.status = { $ne: "deleted" };
    }

    const tasks = await Task.find(query).sort({ createdAt: -1 });
    res.render("dashboard", {
      tasks,
      filter: filter || "all",
      username: req.username,
      cookieName: process.env.COOKIE_NAME || "todo_token",
    });
  } catch (err) {
    next(err);
  }
};

exports.updateTask = async (req, res, next) => {
  try {
    // Only ever update a task that belongs to the requesting user
    const task = await Task.findOne({ _id: req.params.id, user: req.userId });

    if (!task) {
      const err = new Error("Task not found");
      err.statusCode = 404;
      throw err;
    }

    task.status = req.body.status;
    await task.save();

    if (task.status === "completed") {
      sendToUser(req.userId, {
        type: "task_completed",
        task: { id: task._id, title: task.title, status: task.status },
        message: `Task "${task.title}" marked as completed.`,
      });
    }

    res.redirect("/dashboard");
  } catch (err) {
    next(err);
  }
};