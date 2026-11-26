const { pool } = require("../config/configDB");
const { HttpError } = require("../middleware/http");

// Saved page this for favorit page
async function listFavorites(req, res) {
  const result = await pool.query(
    `SELECT l.*,
                COALESCE(
                    json_agg(json_build_object('url', i.url, 'alt', i.alt)
                    ORDER BY i.position) FILTER (WHERE i.id IS NOT NULL),
                    '[]'
                ) AS images
         FROM favorites f
         JOIN listings l ON l.id = f.listing_id
         LEFT JOIN listing_images i ON i.listing_id = l.id
         WHERE f.user_id = $1
         GROUP BY l.id
         ORDER BY max(f.created_at) DESC`,
    [req.user.id],
  );
  res.json({ listings: result.rows });
}

async function addFavorite(req, res) {
  const listing = await pool.query(
    "SELECT id FROM listings WHERE id = $1 AND status = 'active'",
    [req.params.listingId],
  );
  if (!listing.rowCount) throw new HttpError(404, "Listing was not found.");

  await pool.query(
    `INSERT INTO favorites (user_id, listing_id)
         VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [req.user.id, req.params.listingId],
  );
  res.json({ saved: true });
}

async function removeFavorite(req, res) {
  await pool.query(
    "DELETE FROM favorites WHERE user_id = $1 AND listing_id = $2",
    [req.user.id, req.params.listingId],
  );
  res.json({ saved: false });
}

module.exports = { listFavorites, addFavorite, removeFavorite };
