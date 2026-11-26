const { pool } = require("../config/configDB");
const { HttpError } = require("../middleware/http");

// آگاهی
// ثبت گزارش دربارهٔ یک آگهی یا حساب کاربری
async function createReport(req, res) {
  const { listingId = null, reportedUserId = null, reason, evidenceUrls = [] } = req.body;
  if (typeof reason !== "string" || reason.trim().length < 5) {
    throw new HttpError(
      400,
      "Please explain the report in at least 5 characters.",
    );
  }
  if (!listingId && !reportedUserId) {
    throw new HttpError(400, "Choose a listing or user to report.");
  }
  if (reportedUserId === req.user.id) {
    throw new HttpError(400, "You cannot report your own account.");
  }
  if (!Array.isArray(evidenceUrls) || evidenceUrls.length > 12) {
    throw new HttpError(400, "Choose up to 12 evidence photos.");
  }
  const uploadOrigin = `${req.protocol}://${req.get("host")}`;
  const validEvidence = evidenceUrls.every((value) => {
    try {
      const url = new URL(value);
      return url.origin === uploadOrigin
        && /^\/uploads\/[a-f0-9-]{36}\.(jpg|png|webp)$/i.test(url.pathname);
    } catch {
      return false;
    }
  });
  if (!validEvidence) {
    throw new HttpError(400, "Evidence photos must be uploaded through this marketplace.");
  }

  const result = await pool.query(
    `INSERT INTO reports (reporter_id, listing_id, reported_user_id, reason, evidence_urls)
         VALUES ($1, $2, $3, $4, $5::jsonb) RETURNING *`,
    [req.user.id, listingId, reportedUserId, reason.trim().slice(0, 2000), JSON.stringify(evidenceUrls)],
  );
  res.status(201).json({ report: result.rows[0] });
}

module.exports = { createReport };
