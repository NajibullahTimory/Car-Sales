const fs = require("fs/promises");
const path = require("path");
const { randomUUID } = require("crypto");
const { pool } = require("../config/configDB");
const { HttpError } = require("../middleware/http");

// زخیره عکس ها
const uploadDirectory = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "Frontend",
  "public",
  "uploads",
);
const imageTypes = {
  "image/jpeg": {
    extension: ".jpg",
    signature: (buffer) =>
      buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
  },
  "image/png": {
    extension: ".png",
    signature: (buffer) =>
      buffer
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
  },
  "image/webp": {
    extension: ".webp",
    signature: (buffer) =>
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP",
  },
};

// اعتبارسنجی نوع واقعی و اندازهٔ تصویر پیش از ذخیره‌سازی
function decodeImage(file) {
  const type = imageTypes[file?.mimeType];
  if (
    !type ||
    typeof file.data !== "string" ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(file.data)
  ) {
    throw new HttpError(400, "Choose a valid JPG, PNG or WebP image.");
  }

  const buffer = Buffer.from(file.data, "base64");
  if (
    !buffer.length ||
    buffer.length > 5 * 1024 * 1024 ||
    !type.signature(buffer)
  ) {
    throw new HttpError(400, "Each image must be valid and 5 MB or smaller.");
  }

  return { buffer, extension: type.extension };
}

// ذخیرهٔ حداکثر ۱۲ تصویر
async function saveImages(files, req) {
  if (!Array.isArray(files) || files.length < 1 || files.length > 12) {
    throw new HttpError(400, "Choose between 1 and 12 images.");
  }

  const decoded = files.map(decodeImage);
  await fs.mkdir(uploadDirectory, { recursive: true });
  const saved = [];

  try {
    for (const image of decoded) {
      const filename = `${randomUUID()}${image.extension}`;
      await fs.writeFile(path.join(uploadDirectory, filename), image.buffer, {
        flag: "wx",
      });
      saved.push(`${req.protocol}://${req.get("host")}/uploads/${filename}`);
    }
    return saved;
  } catch (error) {
    await Promise.all(
      saved.map((url) =>
        fs
          .unlink(path.join(uploadDirectory, path.basename(url)))
          .catch(() => {}),
      ),
    );
    throw error;
  }
}

// دریافت چند تصویر برای آگهی
async function uploadImages(req, res) {
  const urls = await saveImages(req.body.images, req);
  res.status(201).json({ urls });
}

async function updateAvatar(req, res) {
  const [avatarUrl] = await saveImages([req.body.image], req);
  const result = await pool.query(
    `UPDATE users SET avatar_url = $1, updated_at = now()
         WHERE id = $2
         RETURNING id, name, username, email, role, seller_type, company_name,
                   phone, province, city, about, avatar_url`,
    [avatarUrl, req.user.id],
  );
  res.json({ user: result.rows[0] });
}

module.exports = { uploadImages, updateAvatar };
