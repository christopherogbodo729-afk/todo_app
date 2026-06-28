// const express = require("express");
// const router = express.Router();
// const authController = require("../controllers/authController");

// router.get("/login", (req, res) => res.render("login"));
// router.get("/register", (req, res) => res.render("register"));

// router.post("/register", authController.register);
// router.post("/login", authController.login);

// module.exports = router;

const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.get("/login", (req, res) => res.render("login", { error: null }));
router.get("/register", (req, res) => res.render("register", { error: null }));

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);

module.exports = router;
