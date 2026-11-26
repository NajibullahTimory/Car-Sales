const { pool } = require("../config/configDB");
const { HttpError } = require("../middleware/http");
const { addFilter, listingSelect } = require("../services/listings");
// جست‌وجو و فیلترکردن آگهی‌های فعال
async function search(req, res) {
  const {
    q = "",
    category,
    province,
    make,
    model,
    yearMin,
    yearMax,
    priceMin,
    priceMax,
    condition,
    sort = "newest",
    page = "1",
    limit = "24",
  } = req.query;

  const filters = ["l.status = 'active'"];
  const values = [];
  const searchTerm = String(q).trim().slice(0, 100);

  if (searchTerm) {
    values.push(`%${searchTerm}%`);
    const n = values.length;
    filters.push(`(
            l.title ILIKE $${n} OR l.make ILIKE $${n} OR l.model ILIKE $${n}
            OR l.description ILIKE $${n} OR l.province ILIKE $${n} OR l.city ILIKE $${n}
            OR l.seller_id IN (
                SELECT id FROM users
                WHERE name ILIKE $${n} OR company_name ILIKE $${n}
            )
        )`);
  }

  addFilter(filters, values, "l.category = ?::vehicle_category", category);
  addFilter(filters, values, "l.province = ?", province);
  addFilter(filters, values, "l.make ILIKE ?", make ? `%${make}%` : "");
  addFilter(filters, values, "l.model ILIKE ?", model ? `%${model}%` : "");
  addFilter(filters, values, "l.year >= ?::smallint", yearMin);
  addFilter(filters, values, "l.year <= ?::smallint", yearMax);
  addFilter(filters, values, "l.price >= ?::numeric", priceMin);
  addFilter(filters, values, "l.price <= ?::numeric", priceMax);
  addFilter(filters, values, "l.condition = ?::listing_condition", condition);

  const where = `WHERE ${filters.join(" AND ")}`;
  const orderBy =
    {
      newest: "l.created_at DESC",
      price_asc: "l.price ASC NULLS LAST, l.created_at DESC",
      price_desc: "l.price DESC NULLS LAST, l.created_at DESC",
      year_desc: "l.year DESC NULLS LAST, l.created_at DESC",
    }[sort] || "l.created_at DESC";

  const pageNumber = Math.max(1, Number.parseInt(page, 10) || 1);
  const pageSize = Math.min(50, Math.max(1, Number.parseInt(limit, 10) || 24));
  const countResult = await pool.query(
    `SELECT count(DISTINCT l.id) AS total FROM listings l ${where}`,
    values,
  );
  const result = await pool.query(
    `${listingSelect}
         ${where}
         GROUP BY l.id, u.id
         ORDER BY ${orderBy}
         LIMIT $${values.length + 1}
         OFFSET $${values.length + 2}`,
    [...values, pageSize, (pageNumber - 1) * pageSize],
  );

  res.json({
    listings: result.rows,
    total: Number(countResult.rows[0].total),
    page: pageNumber,
    limit: pageSize,
  });
}

// آگاهی ها
async function getMine(req, res) {
  const result = await pool.query(
    `${listingSelect}
         WHERE l.seller_id = $1
         GROUP BY l.id, u.id
         ORDER BY l.created_at DESC`,
    [req.user.id],
  );
  res.json({ listings: result.rows });
}

async function getById(req, res) {
  const result = await pool.query(
    `${listingSelect}
         WHERE l.id = $1 AND (l.status = 'active' OR l.seller_id = $2)
         GROUP BY l.id, u.id`,
    [req.params.id, req.user?.id || null],
  );
  if (!result.rows[0]) throw new HttpError(404, "Listing was not found.");

  await pool.query("UPDATE listings SET views = views + 1 WHERE id = $1", [
    req.params.id,
  ]);
  const seller = await pool.query(
    "SELECT phone, province, city FROM users WHERE id = $1",
    [result.rows[0].seller_id],
  );
  res.json({ listing: { ...result.rows[0], seller: seller.rows[0] } });
}

module.exports = { search, getMine, getById };
