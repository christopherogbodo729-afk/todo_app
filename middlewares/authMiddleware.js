// module.exports = (req, res, next) => {
//   if (!req.session.userId) {
//     return res.redirect("/login");
//   }
//   next();
// };


// middlewares/authMiddleware.js
//
// Was: checked req.session.userId
// Now: reads the JWT from an httpOnly cookie (or an Authorization: Bearer
// header, for API/test clients), verifies it with the same verifyToken()
// used by the WebSocket handshake, and attaches req.userId.

const { verifyToken } = require("../utils/jwt");

module.exports = (req, res, next) => {
  try {
    let token = null;

    const cookieName = process.env.COOKIE_NAME || "todo_token";
    if (req.cookies && req.cookies[cookieName]) {
      token = req.cookies[cookieName];
    }

    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.redirect("/login");
    }

    const decoded = verifyToken(token);
    req.userId = decoded.id;
    req.username = decoded.username;
    next();

  } catch (err) {
    return res.redirect("/login");
  }
};