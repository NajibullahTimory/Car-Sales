const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const { pool, env } = require("./config/configDB");
const { asyncHandler } = require("./middleware/http");
const { notFound, errorHandler } = require("./middleware/errors");

const authRoutes = require("./routes/auth.routes");
const listingRoutes = require("./routes/listings.routes");
const favoriteRoutes = require("./routes/favorites.routes");
const messageRoutes = require("./routes/messages.routes");
const reportRoutes = require("./routes/reports.routes");
const adminRoutes = require("./routes/admin.routes");
const uploadRoutes = require("./routes/uploads.routes");
const metadataRoutes = require("./routes/metadata.routes");
const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.clientOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origin is not allowed by CORS."));
    },
  }),
);
app.use("/api/uploads", express.json({ limit: "90mb" }));
app.use(express.json({ limit: "300kb" }));

const uploadDirectory = path.join(
  __dirname,
  "..",
  "..",
  "Frontend",
  "public",
  "uploads",
);
app.use("/uploads", express.static(uploadDirectory));

app.get(
  "/api/health",
  asyncHandler(async (_req, res) => {
    await pool.query("SELECT 1");
    res.json({ ok: true, database: "connected" });
  }),
);

app.use("/api/auth", authRoutes);
app.use("/api/metadata", metadataRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/uploads", uploadRoutes);

app.use(notFound);
app.use(errorHandler);

async function startServer() {
  await pool.query("SELECT 1");
  app.listen(env.port, () => {
    console.log(`API is running at http://localhost:${env.port}`);
  });
}

module.exports = { app, startServer };
