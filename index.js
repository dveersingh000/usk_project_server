const express = require("express");
const cors = require("cors");
require("dotenv").config(); // Load .env variables early

const connectDB = require("./src/config/db.js");

// Import Routes
const authRoutes = require("./src/routes/authRoutes.js");
const userRoutes = require("./src/routes/userRoutes.js");
const kycRoutes = require("./src/routes/kycRoutes.js");
const profileRoutes = require("./src/routes/profileRoutes.js");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to the database
connectDB();

// Define API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/kyc", kycRoutes);
app.use("/api/profile", profileRoutes);

// Base route
app.get("/", (req, res) => {
  res.send("Welcome to the API!");
});

// 404 Error Handling (Resource Not Found)
app.use((req, res, next) => {
  res.status(404).json({ message: "Resource not found" });
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("🔥 Error:", err.stack);
  res.status(500).json({ message: "Something went wrong, please try again." });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
