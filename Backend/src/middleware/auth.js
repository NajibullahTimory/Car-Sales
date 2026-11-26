const jwt = require("jsonwebtoken");
const { pool, env } = require("../config/configDB");
const { asyncHandler, HttpError } = require("./http");

// احراز حویت 
// اگر بلاک باشد اجازه نمیدهد
const requireAuth = asyncHandler(async (req, _res, next) => {
  const authorization = req.headers.authorization || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : null;

  if (!token) throw new HttpError(401, "Sign in is required.");

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw new HttpError(401, "The token is invalid or expired.");
  }

  const result = await pool.query(
    `SELECT id, name, username, email, role, seller_type, company_name,
                phone, province, city, about, avatar_url, blocked
         FROM users WHERE id = $1`,
    [payload.sub],
  );
  const user = result.rows[0];

  if (!user || user.blocked) {
    throw new HttpError(403, "This account is blocked or unavailable.");
  }
  req.user = user;
  next();
});

// اجازهٔ پنل مدیریت فقط به حساب مدیر داده می‌شود.
function requireAdmin(req, _res, next) {
  if (req.user?.role !== "admin") {
    return next(new HttpError(403, "Administrator access is required."));
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
