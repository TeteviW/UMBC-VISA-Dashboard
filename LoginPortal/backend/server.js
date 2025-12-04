const express = require("express");
const cors = require("cors");
require("dotenv").config();
const authRoutes = require("./authRoutes");

const app = express();
const PORT = process.env.PORT || 4000;

// Dynamic origin whitelist for local + Github Pages
const allowedOrigins = [
  "http://localhost:3000", // Local frontend
  "https://teteviw.github.io" // Github Repo
];

// verification
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true
  })
);

// parse JSON bodies
app.use(express.json());   

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is running" });
});

// Auth routes (register, login)
app.use("/api", authRoutes);

// Ensure that the backend server can only be access within the device (locally)
app.listen(PORT, "127.0.0.1", () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
