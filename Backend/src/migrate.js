require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { pool } = require("./config/configDB");

// گزارش‌ها، دسته‌بندی‌ها، ولایت‌ها و آگهی‌های اولیه را به‌روز می‌کند.
const migrationFiles = [
  "001_reports_admin_status.sql",
  "002_marketplace_data.sql",
  "003_listing_contact_phone.sql",
].map((filename) => path.join(
  __dirname,
  "..",
  "..",
  "database",
  "migrations",
  filename,
));

async function runMigrations() {
  for (const filename of migrationFiles) {
    await pool.query(fs.readFileSync(filename, "utf8"));
    console.log(`${path.basename(filename)} completed.`);
  }
}

runMigrations()
  .catch((error) => {
    console.error("Could not migrate database:", error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
