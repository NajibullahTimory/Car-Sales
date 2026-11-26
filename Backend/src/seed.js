require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { pool } = require('./config/configDB');

// run detabase and username password
function seedDatabase() {
  return Promise.resolve()
    .then(() => {
      const ownerUsername = String(process.env.OWNER_USERNAME || "")
        .trim()
        .toLowerCase();
      const ownerEmail = String(process.env.OWNER_EMAIL || "")
        .trim()
        .toLowerCase();
      const ownerPassword = process.env.OWNER_PASSWORD;
      if (!/^[a-zA-Z0-9_.-]{3,40}$/.test(ownerUsername)) {
        throw new Error(
          "OWNER_USERNAME must contain 3-40 letters, numbers, dots, underscores or hyphens.",
        );
      }
      if (!ownerEmail) {
        throw new Error("Set OWNER_EMAIL in .env.");
      }
      if (!ownerPassword || ownerPassword.length < 8) {
        throw new Error(
          "Set OWNER_PASSWORD in .env to a password with at least 8 characters.",
        );
      }
      const schemaFile = path.join(__dirname, "..", "..", "database", "schema.sql");
      const schema = fs.readFileSync(schemaFile, "utf8");
      return pool.query(schema).then(() => ({
        ownerUsername,
        ownerEmail,
        ownerPassword,
      }));
    })
    .then(({ ownerUsername, ownerEmail, ownerPassword }) => {
      return pool
        .query(
          `INSERT INTO users (
                    name, username, email, password_hash, role, seller_type,
                    company_name, phone, province
                )
                VALUES ($1, $2, $3, crypt($4, gen_salt('bf', 12)), $5, $6, $7, $8, $9)
                ON CONFLICT (email) DO UPDATE SET
                    name = EXCLUDED.name,
                    username = EXCLUDED.username,
                    password_hash = EXCLUDED.password_hash,
                    role = 'admin'::user_role
                RETURNING id`,
          [
            "Motrly Marketplace Owner",
            ownerUsername,
            ownerEmail,
            ownerPassword,
            "admin",
            "company",
            "Motrly Marketplace",
            "+93 700 000 000",
            "Kabul",
          ],
        )
        .then(() => ownerEmail);
    })
    .then((ownerEmail) => {
      return pool.query(
        `UPDATE users
                 SET role = 'member', updated_at = now()
                 WHERE role = 'admin' AND email <> $1`,
        [ownerEmail],
      );
    });
}
seedDatabase()
  .then(() => {
    console.log("Database schema and owner account are ready.");
  })
  .catch((error) => {
    console.error("Could not seed the database:", error.message);
    process.exitCode = 1;
  }).finally(() => pool.end());
