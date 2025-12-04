// Constant Variables
const express = require("express");
const bcrypt = require("bcrypt");
const { pool } = require("./db");
const router = express.Router();

// POST /api/register
router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required." });
  }

  const userRole = role || "user";

  try {
    // 1) Check if email already exists
    const [rows] = await pool.execute("SELECT id FROM users WHERE email = ?", [email]);

    if (rows.length > 0) {
      return res.status(400).json({ error: "Email is already registered!" });
    }

    // 2) Hash password (like password_hash)
    const passwordHash = await bcrypt.hash(password, 10);

    // 3) Insert new user
    await pool.execute(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
      [name, email, passwordHash, userRole]
    );

    return res.status(201).json({ message: "User registered successfully." });
  } catch (err) {
    console.error("Error in /api/register:", err);
    return res.status(500).json({ error: "Server error during registration." });
  }
});

// POST /api/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const [rows] = await pool.execute(
      "SELECT id, name, email, password_hash, role FROM users WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Incorrect email or password." });
    }

    const user = rows[0];

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: "Incorrect email or password." });
    }

    // In PHP you stored this in $_SESSION and redirected.
    // Here we return JSON; the frontend will handle redirect.

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return res.status(200).json({
      message: "Login successful.",
      user: safeUser,
    });
  } catch (err) {
    console.error("Error in /api/login:", err);
    return res.status(500).json({ error: "Server error during login." });
  }
});

module.exports = router;
