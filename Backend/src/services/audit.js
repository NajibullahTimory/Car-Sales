const { pool } = require('../config/configDB');

// نوشتن یک رویداد مدیریتی با قالب مشترک.
async function writeAudit(adminId, action, targetType, targetId, reason = null, details = {}) {
    await pool.query(
        `INSERT INTO audit_logs (admin_id, action, target_type, target_id, reason, details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [adminId, action, targetType, String(targetId), reason, JSON.stringify(details)],
    );
}

module.exports = { writeAudit };
