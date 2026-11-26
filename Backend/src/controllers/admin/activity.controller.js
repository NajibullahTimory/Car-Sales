const { pool } = require("../../config/configDB");
const { HttpError } = require("../../middleware/http");
const { writeAudit } = require("../../services/audit");

//  بخش ادمین در صفحه اصلی
async function getStats(_req, res) {
  const result = await pool.query(`
        SELECT
            (SELECT count(*) FROM users WHERE role = 'member')::int AS members,
            (SELECT count(*) FROM listings)::int AS listings,
            (SELECT count(*) FROM listings WHERE status = 'pending')::int AS pending_listings,
            (SELECT count(*) FROM reports WHERE status = 'open')::int AS open_reports,
            (SELECT count(*) FROM messages)::int AS messages
    `);
  res.json({ stats: result.rows[0] });
}
// پیام ها
async function listMessages(_req, res) {
  const result = await pool.query(
    `SELECT m.*, sender.name AS sender_name, recipient.name AS recipient_name
         FROM messages m
         JOIN users sender ON sender.id = m.sender_id
         JOIN users recipient ON recipient.id = m.recipient_id
         ORDER BY m.created_at DESC LIMIT 300`,
  );
  res.json({ messages: result.rows });
}

async function deleteMessage(req, res) {
  const result = await pool.query(
    "DELETE FROM messages WHERE id = $1 RETURNING id",
    [req.params.id],
  );
  if (!result.rowCount) throw new HttpError(404, "Message was not found.");

  await writeAudit(req.user.id, "message_deleted", "message", req.params.id);
  res.json({ deleted: true });
}
async function listReports(_req, res) {
  const result = await pool.query(
    `SELECT reports.*, reporter.name AS reporter_name, listings.title AS listing_title
         FROM reports
         JOIN users reporter ON reporter.id = reports.reporter_id
         LEFT JOIN listings ON listings.id = reports.listing_id
         ORDER BY CASE reports.status WHEN 'open' THEN 0 ELSE 1 END,
                  reports.created_at DESC`,
  );
  res.json({ reports: result.rows });
}

async function updateReport(req, res) {
  const { status, adminNote = "" } = req.body;
  if (!["open", "reviewing", "resolved", "dismissed"].includes(status)) {
    throw new HttpError(400, "Invalid report status.");
  }
  const result = await pool.query(
    `UPDATE reports
         SET status = $1, admin_note = $2,
             resolved_at = CASE WHEN $4 THEN now() ELSE NULL END
         WHERE id = $3 RETURNING *`,
        [status, adminNote || null, req.params.id, ['resolved', 'dismissed'].includes(status)],
  );
  if (!result.rowCount) throw new HttpError(404, "Report was not found.");
  res.json({ report: result.rows[0] });
}

async function listAuditLogs(_req, res) {
  const result = await pool.query(
    `SELECT logs.*, users.name AS admin_name
         FROM audit_logs logs
         LEFT JOIN users ON users.id = logs.admin_id
         ORDER BY logs.created_at DESC LIMIT 300`,
  );
  res.json({ logs: result.rows });
}

module.exports = {
  getStats,
  listMessages,
  deleteMessage,
  listReports,
  updateReport,
  listAuditLogs,
};
