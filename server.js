require("dotenv").config(); // MUST be at the top

const mongoose = require("mongoose");
const app = require("./app");
const MONGODB_URI = process.env.MONGO_URI;


function connectToMongoDB() {
mongoose.connect(MONGODB_URI)

 mongoose.connection.on("connected", () => {
    console.log("Connected to MongoDB");
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  });

  mongoose.connection.on("error", (err) => {
    console.error("Error connecting to MongoDB:", err);
  });
};

connectToMongoDB ();
