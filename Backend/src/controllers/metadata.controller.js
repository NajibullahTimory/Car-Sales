const { pool } = require("../config/configDB");

// گزینه‌های عمومی دسته‌بندی و ولایت را از دیتابیس می‌خواند.
async function getMarketplaceMetadata(_req, res) {
  const [categories, provinces] = await Promise.all([
    pool.query("SELECT id, label, sort_order FROM marketplace_categories ORDER BY sort_order"),
    pool.query("SELECT name, is_all, sort_order FROM marketplace_provinces ORDER BY sort_order"),
  ]);

  res.json({ categories: categories.rows, provinces: provinces.rows });
}

module.exports = { getMarketplaceMetadata };
