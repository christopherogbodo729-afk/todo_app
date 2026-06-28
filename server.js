// require("dotenv").config(); // MUST be at the top

// const mongoose = require("mongoose");
// const app = require("./app");
// const MONGODB_URI = process.env.MONGO_URI;

// function connectToMongoDB() {
// mongoose.connect(MONGODB_URI)

//  mongoose.connection.on("connected", () => {
//     console.log("Connected to MongoDB");
//     const PORT = process.env.PORT || 3000;
//     app.listen(PORT, () => {
//       console.log(`Server is running on http://localhost:${PORT}`);
//     });
//   });

//   mongoose.connection.on("error", (err) => {
//     console.error("Error connecting to MongoDB:", err);
//   });
// };

// connectToMongoDB ();

require("dotenv").config(); // MUST be at the top

const http = require("http");
const mongoose = require("mongoose");
const app = require("./app");
const { initWebSocketServer } = require("./utils/Wsmanager");
const { startOverdueCron } = require("./utils/overdueChecker");
const logger = require("./utils/logger");

const MONGODB_URI = process.env.MONGO_URI;

function connectToMongoDB() {
  mongoose.connect(MONGODB_URI);

  mongoose.connection.on("connected", () => {
    logger.info("Connected to MongoDB");

    // Wrap app in a raw http.Server so Express AND the WebSocket server
    // can share the same port - important for hosting platforms (Render)
    // that only expose one port per service.
    const server = http.createServer(app);
    initWebSocketServer(server);
    startOverdueCron();

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      logger.info(`Server is running on http://localhost:${PORT}`);
    });
  });

  mongoose.connection.on("error", (err) => {
    logger.error("Error connecting to MongoDB", { error: err.message });
  });
}

connectToMongoDB();