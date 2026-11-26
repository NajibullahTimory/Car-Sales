const express = require('express');
const { asyncHandler } = require('../middleware/http');
const { requireAuth } = require('../middleware/auth');
const { uploadImages, updateAvatar } = require('../controllers/uploads.controller');

const router = express.Router();

// آپلود فقط برای کاربران واردشده فعال است.
router.use(requireAuth);
// تصاویر آگهی را ذخیره می‌کند.
router.post('/images', asyncHandler(uploadImages));
// عکس پروفایل را ذخیره می‌کند.
router.post('/avatar', asyncHandler(updateAvatar));

module.exports = router;
