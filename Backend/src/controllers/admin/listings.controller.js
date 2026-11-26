const { pool } = require("../../config/configDB");
const { HttpError } = require("../../middleware/http");
const { writeAudit } = require("../../services/audit");

// Listings
async function listListings(req, res) {
  const status = req.query.status || null;
  const result = await pool.query(
    `SELECT l.*, seller.name AS seller_name, seller.email AS seller_email,
                COALESCE(
                    json_agg(json_build_object('url', i.url, 'alt', i.alt)
                    ORDER BY i.position) FILTER (WHERE i.id IS NOT NULL),
                    '[]'
                ) AS images
         FROM listings l
         JOIN users seller ON seller.id = l.seller_id
         LEFT JOIN listing_images i ON i.listing_id = l.id
         WHERE ($1::listing_status IS NULL OR l.status = $1)
         GROUP BY l.id, seller.id
         ORDER BY CASE l.status WHEN 'pending' THEN 0 ELSE 1 END, l.created_at DESC`,
    [status],
  );
  res.json({ listings: result.rows });
}

async function deleteListing(req, res) {
  const result = await pool.query(
    "DELETE FROM listings WHERE id = $1 RETURNING title",
    [req.params.id],
  );
  if (!result.rowCount) throw new HttpError(404, "Listing was not found.");

  await writeAudit(
    req.user.id,
    "listing_deleted",
    "listing",
    req.params.id,
    req.body?.reason || null,
    { title: result.rows[0].title },
  );
  res.json({ deleted: true });
}

module.exports = { listListings, deleteListing };
