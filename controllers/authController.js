// const User = require("../models/User");
// const bcrypt = require("bcrypt");

// exports.register = async (req, res, next) => {
//   try {
//     const hashedPassword = await bcrypt.hash(req.body.password, 10);

//     const user = await User.create({
//       username: req.body.username,
//       password: hashedPassword,
//     });

//     res.redirect("/login");
//   } catch (err) {
//     next(err);
//   }
// };

// exports.login = async (req, res, next) => {
//   try {
//     const user = await User.findOne({ username: req.body.username });

//     if (!user) return res.send("User not found");

//     const valid = await bcrypt.compare(req.body.password, user.password);

//     if (!valid) return res.send("Invalid credentials");

//     req.session.userId = user._id;

//     res.redirect("/dashboard");
//   } catch (err) {
//     next(err);
//   }
// };


// controllers/authController.js
//
// Same register/login shape as your original. The only real change:
// login no longer sets req.session.userId - it signs a JWT and sets it
// as an httpOnly cookie. That cookie is what authMiddleware.js reads on
// every request, and what the browser passes to the WebSocket connection.

const User = require("../models/user");
const bcrypt = require("bcrypt");
const { signToken } = require("../utils/jwt");

const COOKIE_NAME = process.env.COOKIE_NAME || "todo_token";

exports.register = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || username.trim().length < 3) {
      return res.render("register", { error: "Username must be at least 3 characters" });
    }
    if (!password || password.length < 6) {
      return res.render("register", { error: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({ username: username.trim() });
    if (existing) {
      return res.render("register", { error: "That username is already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      username: username.trim(),
      password: hashedPassword,
    });

    res.redirect("/login");
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username: username?.trim() });
    if (!user) {
      return res.render("login", { error: "Invalid username or password" });
    }

    const valid = await bcrypt.compare(password || "", user.password);
    if (!valid) {
      return res.render("login", { error: "Invalid username or password" });
    }

    const token = signToken({ id: user._id, username: user.username });

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.redirect("/dashboard");
  } catch (err) {
    next(err);
  }
};

exports.logout = (req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.redirect("/login");
};
