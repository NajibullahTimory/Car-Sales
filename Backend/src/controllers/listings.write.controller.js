const { pool } = require("../config/configDB");
const { HttpError } = require("../middleware/http");
const { allowedCategories, listingSelect } = require("../services/listings");

// ساخت آگهی و تصاویر
async function create(req, res) {
  const {
    title,
    category,
    make,
    model,
    year,
    firstRegistration,
    price,
    currency = "USD",
    sellerContactPhone = null,
    province,
    city,
    mileage,
    fuel,
    transmission,
    bodyType,
    condition = "used",
    description = "",
    specifications = {},
    imageUrls = [],
  } = req.body;

  if (!title?.trim() || title.trim().length < 4 || !province) {
    throw new HttpError(400, "Title and province are required.");
  }
  if (!allowedCategories.includes(category)) {
    throw new HttpError(400, "Choose a valid vehicle category.");
  }
  if (!["USD", "AFN"].includes(currency)) {
    throw new HttpError(400, "Choose USD or AFN as the listing currency.");
  }
  if (sellerContactPhone !== null && (typeof sellerContactPhone !== "string" || sellerContactPhone.length > 40)) {
    throw new HttpError(400, "Contact phone must be 40 characters or fewer.");
  }
  if (!["new", "used", "damaged"].includes(condition)) {
    throw new HttpError(400, "Choose a valid condition.");
  }
  if (
    !Array.isArray(imageUrls) ||
    imageUrls.length > 12 ||
    imageUrls.some((url) => !/^https?:\/\//i.test(url))
  ) {
    throw new HttpError(400, "Provide up to 12 HTTP/HTTPS image links.");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `INSERT INTO listings (
                seller_id, title, category, make, model, year,
                first_registration, price, currency, province, city,
                mileage, fuel, transmission, body_type, condition,
                description, specifications, seller_contact_phone, status
             ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15, $16, $17, $18, $19, 'active'
             ) RETURNING *`,
      [
        req.user.id,
        title.trim(),
        category,
        make || null,
        model || null,
        year || null,
        firstRegistration || null,
        price || null,
        currency,
        province,
        city || null,
        mileage || null,
        fuel || null,
        transmission || null,
        bodyType || null,
        condition,
        description,
        JSON.stringify(specifications),
        sellerContactPhone?.trim() || null,
      ],
    );

    for (const [position, url] of imageUrls.entries()) {
      await client.query(
        `INSERT INTO listing_images (listing_id, url, alt, position)
                 VALUES ($1, $2, $3, $4)`,
        [result.rows[0].id, url, title.trim(), position],
      );
    }

    const listingResult = await client.query(
      `${listingSelect} WHERE l.id = $1 GROUP BY l.id, u.id`,
      [result.rows[0].id],
    );
    await client.query("COMMIT");
    res.status(201).json({
      listing: listingResult.rows[0],
      message: "Listing published successfully.",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// حذف آگهی توسط مالک یا مدیر.
async function remove(req, res) {
  const result = await pool.query(
    `DELETE FROM listings
         WHERE id = $1 AND (seller_id = $2 OR $3 = true)
         RETURNING id`,
    [req.params.id, req.user.id, req.user.role === "admin"],
  );
  if (!result.rowCount)
    throw new HttpError(404, "Listing was not found or is not yours.");
  res.json({ deleted: true, id: result.rows[0].id });
}

// ادیت آگاهی
async function update(req, res) {
  const {
    title,
    category,
    make,
    model,
    year,
    price,
    currency = "USD",
    sellerContactPhone = null,
    province,
    city,
    mileage,
    fuel,
    transmission,
    condition = "used",
    description = "",
    imageUrls,
  } = req.body;

  if (!title?.trim() || title.trim().length < 4 || !province) {
    throw new HttpError(400, "Title and province are required.");
  }
  if (!allowedCategories.includes(category)) {
    throw new HttpError(400, "Choose a valid vehicle category.");
  }
  if (!["USD", "AFN"].includes(currency)) {
    throw new HttpError(400, "Choose USD or AFN as the listing currency.");
  }
  if (sellerContactPhone !== null && (typeof sellerContactPhone !== "string" || sellerContactPhone.length > 40)) {
    throw new HttpError(400, "Contact phone must be 40 characters or fewer.");
  }
  if (!["new", "used", "damaged"].includes(condition)) {
    throw new HttpError(400, "Choose a valid condition.");
  }
  if (
    imageUrls !== undefined &&
    (!Array.isArray(imageUrls) ||
      imageUrls.length > 12 ||
      imageUrls.some((url) => !/^https?:\/\//i.test(url)))
  ) {
    throw new HttpError(400, "Provide up to 12 HTTP/HTTPS image links.");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `UPDATE listings
             SET title = $1, category = $2, make = $3, model = $4, year = $5,
                 price = $6, currency = $7, province = $8, city = $9, mileage = $10, fuel = $11,
                 transmission = $12, condition = $13, description = $14,
                 seller_contact_phone = $15,
                 updated_at = now()
             WHERE id = $16 AND seller_id = $17
             RETURNING id`,
      [
        title.trim(),
        category,
        make || null,
        model || null,
        year || null,
        price || null,
        currency,
        province,
        city || null,
        mileage || null,
        fuel || null,
        transmission || null,
        condition,
        description,
        sellerContactPhone?.trim() || null,
        req.params.id,
        req.user.id,
      ],
    );
    if (!result.rowCount) {
      throw new HttpError(404, "Listing was not found or is not yours.");
    }

    if (imageUrls !== undefined) {
      await client.query("DELETE FROM listing_images WHERE listing_id = $1", [
        req.params.id,
      ]);
      for (const [position, url] of imageUrls.entries()) {
        await client.query(
          `INSERT INTO listing_images (listing_id, url, alt, position)
                     VALUES ($1, $2, $3, $4)`,
          [req.params.id, url, title.trim(), position],
        );
      }
    }

    const listingResult = await client.query(
      `${listingSelect} WHERE l.id = $1 GROUP BY l.id, u.id`,
      [req.params.id],
    );
    await client.query("COMMIT");
    res.json({
      listing: listingResult.rows[0],
      message: "Listing updated successfully.",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { create, update, remove };
