// const express = require("express");
// const session = require("express-session");
// const mongoose = require("mongoose");
// const morgan = require("morgan");

// const authRoutes = require("./routes/authRoutes");
// const taskRoutes = require("./routes/taskRoutes");
// const errorMiddleware = require("./middlewares/errorMiddleware");

// const app = express();

// app.use(express.urlencoded({ extended: true }));
// app.use(morgan("dev"));

// app.use(
//   session({
//     secret: "secret",
//     resave: false,
//     saveUninitialized: true,
//   }),
// );

// app.set("view engine", "ejs");

// app.use(authRoutes);
// app.use(taskRoutes);

// app.use(errorMiddleware);

// module.exports = app;

// module.exports = app;

const express = require("express");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const errorMiddleware = require("./middlewares/errorMiddleware");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // for API/test clients posting JSON
app.use(morgan("dev"));
app.use(cookieParser()); // replaces express-session - reads the JWT cookie
app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");

// health check - useful once this is hosted (Render, etc.)
app.get("/health", (req, res) => res.json({ status: "ok" }));

app.get("/", (req, res) => res.redirect("/dashboard"));

app.use(authRoutes);
app.use(taskRoutes);

app.use(errorMiddleware);

module.exports = app;