// مقدارها و query مشترک برای خواندن آگهی‌ها.
const allowedCategories = [
  "car",
  "motorcycle",
  "truck",
  "bus",
  "tractor",
  "construction",
  "trailer",
  "parts",
  "other",
];

const listingSelect = `
    SELECT l.*,
           u.name AS seller_name,
           u.seller_type,
           u.avatar_url AS seller_avatar_url,
           u.company_name,
           COALESCE(
               json_agg(
                   json_build_object('id', i.id, 'url', i.url, 'alt', i.alt)
                   ORDER BY i.position
               ) FILTER (WHERE i.id IS NOT NULL),
               '[]'
           ) AS images
    FROM listings l
    JOIN users u ON u.id = l.seller_id
    LEFT JOIN listing_images i ON i.listing_id = l.id
`;

// افزودن فیلتر با پارامتر SQL برای جلوگیری از تزریق ورودی.
function addFilter(filters, values, expression, value) {
  if (value === undefined || value === null || value === "") return;
  values.push(value);
  filters.push(expression.replace("?", `$${values.length}`));
}

module.exports = { allowedCategories, listingSelect, addFilter };
