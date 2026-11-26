const express = require("express");
const { asyncHandler } = require("../middleware/http");
const { getMarketplaceMetadata } = require("../controllers/metadata.controller");

const router = express.Router();

// دسته‌بندی‌ها و ولایت‌ها برای جست‌وجو و فرم‌ها.
router.get("/", asyncHandler(getMarketplaceMetadata));

module.exports = router;
