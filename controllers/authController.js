const User = require("../models/User");
const bcrypt = require("bcrypt");

exports.register = async (req, res, next) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const user = await User.create({
      username: req.body.username,
      password: hashedPassword,
    });

    res.redirect("/login");
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.body.username });

    if (!user) return res.send("User not found");

    const valid = await bcrypt.compare(req.body.password, user.password);

    if (!valid) return res.send("Invalid credentials");

    req.session.userId = user._id;

    res.redirect("/dashboard");
  } catch (err) {
    next(err);
  }
};
