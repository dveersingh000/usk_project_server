const express = require("express");
const cors = require("cors");
require("dotenv").config(); // Load .env variables early

const connectDB = require("./src/config/db.js");
const userRoutes = require("./src/routes/auth.js");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Connecting to the database
connectDB();

app.use("/api/auth", userRoutes);

// Base route
app.get("/", (req, res) => {
  res.send("Welcome to the API!");
});

// Error handling
app.use((req, res, next) => {
  res.status(404).json({ message: "Resource not found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
