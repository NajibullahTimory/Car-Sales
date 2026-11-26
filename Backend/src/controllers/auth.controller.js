const jwt = require("jsonwebtoken");
const { pool, env } = require("../config/configDB");
const { HttpError } = require("../middleware/http");
const { verifyScryptPassword } = require("../utils/password");

// This is for contrling and login page
function createToken(user) {
  return jwt.sign({ sub: user.id }, env.jwtSecret, { expiresIn: "24h" });
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    seller_type: user.seller_type,
    company_name: user.company_name,
    phone: user.phone,
    province: user.province,
    city: user.city,
    about: user.about,
    avatar_url: user.avatar_url,
  };
}

async function register(req, res) {
  const {
    name,
    username,
    email,
    password,
    sellerType = "private",
    companyName = "",
    phone = "",
    province = "",
    city = "",
    about = "",
    avatarUrl = "",
  } = req.body;

  if (
    !name?.trim() ||
    !/^[a-zA-Z0-9_.-]{3,40}$/.test(username || "") ||
    !/^\S+@\S+\.\S+$/.test(email || "") ||
    !password ||
    password.length < 8
  ) {
    throw new HttpError(
      400,
      "Enter a name, username (3-40 letters/numbers), valid email, and password of at least 8 characters.",
    );
  }
  if (
    name.trim().length > 120 ||
    String(companyName).length > 160 ||
    String(phone).length > 40 ||
    String(province).length > 80 ||
    String(city).length > 100 ||
    String(about).length > 2000
  ) {
    throw new HttpError(400, "One or more profile fields are too long.");
  }
  if (!["private", "company"].includes(sellerType)) {
    throw new HttpError(400, "Seller type must be private or company.");
  }
  if (avatarUrl && !/^https?:\/\//i.test(avatarUrl)) {
    throw new HttpError(
      400,
      "Profile photo must be a valid HTTP or HTTPS image link.",
    );
  }

  try {
    const result = await pool.query(
      `INSERT INTO users (name, username, email, password_hash, seller_type,
                               company_name, phone, province, city, about, avatar_url)
             VALUES ($1, lower($2), lower($3), crypt($4, gen_salt('bf', 12)), $5, $6, $7, $8, $9, $10, $11)
             RETURNING *`,
      [
        name.trim(),
        username,
        email,
        password,
        sellerType,
        companyName || null,
        phone || null,
        province || null,
        city || null,
        about || null,
        avatarUrl || null,
      ],
    );

    const user = publicUser(result.rows[0]);
    res.status(201).json({ user, token: createToken(user) });
  } catch (error) {
    if (error.code === "23505") {
      throw new HttpError(409, "That username or email is already registered.");
    }
    throw error;
  }
}

async function login(req, res) {
  const { identifier, email, password } = req.body;
  const loginIdentifier = String(identifier || email || "");
  if (!loginIdentifier || !password) {
    throw new HttpError(400, "Username/email and password are required.");
  }

  const result = await pool.query(
    "SELECT * FROM users WHERE email = lower($1) OR username = lower($1) LIMIT 1",
    [loginIdentifier],
  );
  const userRecord = result.rows[0];

  if (!userRecord || userRecord.blocked) {
    throw new HttpError(401, "You are blocked");
  }

  const passwordHash = userRecord.password_hash || "";
  let passwordMatches = false;
  if (/^\$2[aby]\$/.test(passwordHash)) {
    const verification = await pool.query(
      "SELECT password_hash = crypt($1, password_hash) AS matches FROM users WHERE id = $2",
      [password, userRecord.id],
    );
    passwordMatches = verification.rows[0]?.matches === true;
  } else if (passwordHash.startsWith("scrypt$")) {
    passwordMatches = await verifyScryptPassword(password, passwordHash);
  } else if (!passwordHash.startsWith("disabled$")) {
    // Existing databases may still contain the old plain password value.
    passwordMatches = password === passwordHash;
  }
  if (!passwordMatches)
    throw new HttpError(401, "Email or password is incorrect.");

  // Upgrade legacy plain passwords after the first successful login.
  if (!passwordHash.startsWith("$2") && !passwordHash.startsWith("scrypt$")) {
    await pool.query(
      "UPDATE users SET password_hash = crypt($1, gen_salt('bf', 12)), updated_at = now() WHERE id = $2",
      [password, userRecord.id],
    );
  }

  const user = publicUser(userRecord);
  res.json({ user, token: createToken(user) });
}

async function getCurrentUser(req, res) {
  res.json({ user: req.user });
}

async function updateProfile(req, res) {
  const {
    name,
    sellerType,
    companyName,
    phone,
    province,
    city,
    about,
    avatarUrl,
  } = req.body;

  if (!name?.trim()) throw new HttpError(400, "Your name is required.");
  if (
    name.trim().length > 120 ||
    String(companyName || "").length > 160 ||
    String(phone || "").length > 40 ||
    String(province || "").length > 80 ||
    String(city || "").length > 100 ||
    String(about || "").length > 2000
  ) {
    throw new HttpError(400, "One or more profile fields are too long.");
  }
  if (sellerType && !["private", "company"].includes(sellerType)) {
    throw new HttpError(400, "Seller type must be private or company.");
  }
  if (avatarUrl && !/^https?:\/\//i.test(avatarUrl)) {
    throw new HttpError(
      400,
      "Profile photo must be a valid HTTP or HTTPS image link.",
    );
  }

  const result = await pool.query(
    `UPDATE users
         SET name = $1,
             seller_type = COALESCE($2, seller_type),
             company_name = $3,
             phone = $4,
             province = $5,
             city = $6,
             about = $7,
             avatar_url = COALESCE($8, avatar_url),
             updated_at = now()
         WHERE id = $9
         RETURNING id, name, username, email, role, seller_type, company_name,
                   phone, province, city, about, avatar_url`,
    [
      name.trim(),
      sellerType || null,
      companyName || null,
      phone || null,
      province || null,
      city || null,
      about || null,
      avatarUrl || null,
      req.user.id,
    ],
  );

  res.json({ user: publicUser(result.rows[0]) });
}

module.exports = { register, login, getCurrentUser, updateProfile };
