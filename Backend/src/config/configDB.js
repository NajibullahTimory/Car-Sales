require("dotenv").config();
const { Pool } = require("pg");

// آدرس‌های فرانت‌اند را از محیط می‌گیرد و ورودی‌های خالی را کنار می‌گذارد.
const clientOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const env = {
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  // آدرس‌های توسعهٔ محلی همیشه مجازند و آدرس تکراری حذف می‌شود.
  clientOrigins: [...new Set([
    ...clientOrigins,
    "http://localhost:5000",
    "http://127.0.0.1:5000",
  ])],
  pgSsl: process.env.PGSSL === "true",
};

if (!env.databaseUrl) {
  throw new Error("DATABASE_URL is missing in Backend/.env.");
}
if (!env.jwtSecret) {
  throw new Error("JWT_SECRET is missing in Backend/.env.");
}

const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: env.pgSsl ? { rejectUnauthorized: false } : undefined,
});

module.exports = { pool, env };
