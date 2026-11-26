const { pool } = require("../config/configDB");
const { HttpError } = require("../middleware/http");

// پیام ها
// دریافت پیام‌هایی که کاربر فرستاده یا دریافت کرده است
async function listMessages(req, res) {
  const result = await pool.query(
    `SELECT m.*, sender.name AS sender_name, recipient.name AS recipient_name
         FROM messages m
         JOIN users sender ON sender.id = m.sender_id
         JOIN users recipient ON recipient.id = m.recipient_id
         WHERE m.sender_id = $1 OR m.recipient_id = $1
         ORDER BY m.created_at DESC
         LIMIT 200`,
    [req.user.id],
  );
  res.json({ messages: result.rows });
}

// پیام‌های خوانده‌نشده را برای اعلان زنگ برمی‌گرداند
async function listUnreadMessages(req, res) {
  const result = await pool.query(
    `SELECT m.id, m.sender_id, m.recipient_id, m.listing_id, m.body, m.created_at,
                sender.name AS sender_name, count(*) OVER() AS unread_total
         FROM messages m
         JOIN users sender ON sender.id = m.sender_id
         WHERE m.recipient_id = $1 AND m.read_at IS NULL
         ORDER BY m.created_at DESC
         LIMIT 20`,
    [req.user.id],
  );
  res.json({
    messages: result.rows,
    unreadCount: Number(result.rows[0]?.unread_total || 0),
  });
}

// ساخت پیام جدید میان دو کاربر
async function createMessage(req, res) {
  const { recipientId, listingId = null, body } = req.body;
  if (
    !recipientId ||
    typeof body !== "string" ||
    !body.trim() ||
    body.length > 5000
  ) {
    throw new HttpError(400, "Recipient and message text are required.");
  }
  if (recipientId === req.user.id) {
    throw new HttpError(400, "You cannot send a message to yourself.");
  }

  const recipient = await pool.query(
    "SELECT id FROM users WHERE id = $1 AND blocked = false",
    [recipientId],
  );
  if (!recipient.rowCount) throw new HttpError(404, "Recipient was not found.");

  const inserted = await pool.query(
    `INSERT INTO messages (sender_id, recipient_id, listing_id, body)
         VALUES ($1, $2, $3, $4) RETURNING id`,
    [req.user.id, recipientId, listingId, body.trim()],
  );
  const result = await pool.query(
    `SELECT messages.*, sender.name AS sender_name, recipient.name AS recipient_name
         FROM messages
         JOIN users sender ON sender.id = messages.sender_id
         JOIN users recipient ON recipient.id = messages.recipient_id
         WHERE messages.id = $1`,
    [inserted.rows[0].id],
  );
  res.status(201).json({ message: result.rows[0] });
}

// علامت‌گذاری پیام دریافت‌شده به‌عنوان خوانده‌شده
async function markMessageRead(req, res) {
  const result = await pool.query(
    `UPDATE messages SET read_at = now()
         WHERE id = $1 AND recipient_id = $2
         RETURNING id, read_at`,
    [req.params.id, req.user.id],
  );
  if (!result.rowCount) throw new HttpError(404, "Message was not found.");
  res.json({ message: result.rows[0] });
}

module.exports = {
  listMessages,
  listUnreadMessages,
  createMessage,
  markMessageRead,
};
