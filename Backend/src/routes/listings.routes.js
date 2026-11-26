const express = require("express");
const { asyncHandler } = require("../middleware/http");
const { requireAuth } = require("../middleware/auth");
const readController = require("../controllers/listings.read.controller");
const writeController = require("../controllers/listings.write.controller");
const router = express.Router();
router.use(requireAuth);

// جست‌وجوی آگهی‌ها.
router.get("/", asyncHandler(readController.search));
// آگهی‌های ثبت‌شده توسط کاربر را می‌خواند.
router.get("/mine", asyncHandler(readController.getMine));
// جزئیات یک آگهی را می‌خواند.
router.get("/:id", asyncHandler(readController.getById));
// ساخت، ویرایش و حذف آگهی برای کاربران واردشده.
router.post("/", asyncHandler(writeController.create));
// آگهی متعلق به کاربر را ویرایش می‌کند.
router.patch("/:id", asyncHandler(writeController.update));
// آگهی متعلق به کاربر را حذف می‌کند.
router.delete("/:id", asyncHandler(writeController.remove));

module.exports = router;
