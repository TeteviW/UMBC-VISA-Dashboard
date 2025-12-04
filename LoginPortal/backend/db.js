const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Extract env variables
const {
  AIVEN_DB_PORT,
  AIVEN_DB_HOST,
  AIVEN_DB_USER,
  AIVEN_DB_PASSWORD,
  AIVEN_DB_NAME,
  AIVEN_CA_CERT_PATH,
} = process.env;

// Validate env variables
if (!AIVEN_DB_HOST || !AIVEN_DB_PORT || !AIVEN_DB_USER || !AIVEN_DB_PASSWORD || !AIVEN_DB_NAME) {
  console.error("[ERROR] Missing one or more required DB env vars.");
  console.error("Expected: AIVEN_DB_HOST, AIVEN_DB_PORT, AIVEN_DB_USER, AIVEN_DB_PASSWORD, AIVEN_DB_NAME");
  process.exit(1);
}

// Resolve CA certificate path
const caCertPath = AIVEN_CA_CERT_PATH || path.join(__dirname, "ca.pem");

// Try reading CA certificate
let ca;
try {
  ca = fs.readFileSync(caCertPath, "utf8");
  console.log(`[INFO] Loaded CA certificate from ${caCertPath}`);
} catch (err) {
  console.error(`[ERROR] Failed to read CA certificate at: ${caCertPath}`);
  console.error(err.message);
  process.exit(1);
}

// Create and export MySQL connection pool
const pool = mysql.createPool({
  host: AIVEN_DB_HOST,
  port: Number(AIVEN_DB_PORT),
  user: AIVEN_DB_USER,
  password: AIVEN_DB_PASSWORD,
  database: AIVEN_DB_NAME,
  ssl: { ca },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = { pool };
