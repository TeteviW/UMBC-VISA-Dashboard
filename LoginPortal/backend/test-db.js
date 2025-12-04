const { pool } = require("./db");

(async () => {
  try {
    const [rows] = await pool.query("SELECT NOW()");
    console.log("✅ Connected to Aiven DB:", rows[0]);
    process.exit(0);
  } catch (err) {
    console.error("❌ DB Test Failed:", err.message);
    process.exit(1);
  }
})();
