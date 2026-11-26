const { pool } = require("../../config/configDB");
const { HttpError } = require("../../middleware/http");
const { writeAudit } = require("../../services/audit");

// جست‌وجوی اعضا در پنل مدیریت
async function listUsers(req, res) {
  const search = `%${String(req.query.q || "").slice(0, 100)}%`;
  const result = await pool.query(
    `SELECT id, name, username, email, seller_type, company_name, phone,
                province, blocked, block_reason, created_at
         FROM users
         WHERE role = 'member' AND ($1 = '%%' OR name ILIKE $1 OR username ILIKE $1 OR email ILIKE $1)
         ORDER BY created_at DESC
         LIMIT 300`,
    [search],
  );
  res.json({ users: result.rows });
}

// مسدود یا آزادکردن حساب عضو
async function setUserBlocked(req, res) {
  const { blocked, reason = "" } = req.body;
  if (typeof blocked !== "boolean") {
    throw new HttpError(400, "blocked must be true or false.");
  }
  if (req.params.id === req.user.id) {
    throw new HttpError(
      400,
      "You cannot block your own administrator account.",
    );
  }

  const result = await pool.query(
    `UPDATE users SET blocked = $1, block_reason = $2, updated_at = now()
         WHERE id = $3 AND role = 'member'
         RETURNING id, name, email, blocked, block_reason`,
    [blocked, blocked ? String(reason).slice(0, 1000) : null, req.params.id],
  );
  if (!result.rowCount) throw new HttpError(404, "Member was not found.");

  if (blocked) {
    await pool.query(
      `UPDATE listings
             SET status = 'blocked', moderation_note = $1, updated_at = now()
             WHERE seller_id = $2 AND status IN ('active', 'pending')`,
      [
        String(reason || "Seller account blocked by administrator").slice(
          0,
          1000,
        ),
        req.params.id,
      ],
    );
  }

  await writeAudit(
    req.user.id,
    blocked ? "user_blocked" : "user_unblocked",
    "user",
    req.params.id,
    reason,
  );
  res.json({ user: result.rows[0] });
}

// ارسال هشدار برای یک عضو فعال.
async function warnUser(req, res) {
  const body = String(req.body?.body || "").trim();
  if (body.length < 3 || body.length > 2000) {
    throw new HttpError(
      400,
      "Warning message must be between 3 and 2000 characters.",
    );
  }

  const recipient = await pool.query(
    `SELECT id FROM users WHERE id = $1 AND role = 'member' AND blocked = false`,
    [req.params.id],
  );
  if (!recipient.rowCount)
    throw new HttpError(404, "Member was not found or is blocked.");

  const result = await pool.query(
    `INSERT INTO messages (sender_id, recipient_id, body)
         VALUES ($1, $2, $3) RETURNING id, body, created_at`,
    [req.user.id, req.params.id, body],
  );
  await writeAudit(req.user.id, "user_warned", "user", req.params.id, body);
  res.status(201).json({ message: result.rows[0] });
}

// حذف حساب عضو از سامانه.
async function deleteUser(req, res) {
  if (req.params.id === req.user.id) {
    throw new HttpError(
      400,
      "You cannot delete your own administrator account.",
    );
  }

  const result = await pool.query(
    `DELETE FROM users WHERE id = $1 AND role = 'member'
         RETURNING id, name, email`,
    [req.params.id],
  );
  if (!result.rowCount) throw new HttpError(404, "Member was not found.");

  const member = result.rows[0];
  await writeAudit(
    req.user.id,
    "user_deleted",
    "user",
    member.id,
    req.body?.reason || "Removed by administrator",
    { name: member.name, email: member.email },
  );
  res.json({ deleted: true, user: member });
}

module.exports = { listUsers, setUserBlocked, warnUser, deleteUser };
