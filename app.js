const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const morgan = require("morgan");

const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const errorMiddleware = require("./middlewares/errorMiddleware");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
  }),
);

app.set("view engine", "ejs");

app.use(authRoutes);
app.use(taskRoutes);

app.use(errorMiddleware);

module.exports = app;

module.exports = app;
