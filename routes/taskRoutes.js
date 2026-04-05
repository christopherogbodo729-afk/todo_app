const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/dashboard", authMiddleware, taskController.getTasks);
router.post("/tasks", authMiddleware, taskController.createTask);
router.post("/tasks/:id", authMiddleware, taskController.updateTask);

module.exports = router;
