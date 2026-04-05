const Task = require("../models/Task");

exports.createTask = async (req, res, next) => {
  try {
    await Task.create({
      title: req.body.title,
      user: req.session.userId,
    });

    res.redirect("/dashboard");
  } catch (err) {
    next(err);
  }
};

exports.getTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({ user: req.session.userId });
    res.render("dashboard", { tasks });
  } catch (err) {
    next(err);
  }
};

exports.updateTask = async (req, res, next) => {
  try {
    await Task.findByIdAndUpdate(req.params.id, {
      status: req.body.status,
    });

    res.redirect("/dashboard");
  } catch (err) {
    next(err);
  }
};
