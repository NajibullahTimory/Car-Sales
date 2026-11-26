const express = require('express');
const { asyncHandler } = require('../middleware/http');
const { requireAuth } = require('../middleware/auth');
const controller = require('../controllers/favorites.controller');

const router = express.Router();

// این مسیرها فقط کاربران واردشده را می‌پذیرند.
router.use(requireAuth);
// آگهی‌های نشان‌شده را می‌خواند.
router.get('/', asyncHandler(controller.listFavorites));
// آگهی را به نشان‌شده‌ها اضافه می‌کند.
router.put('/:listingId', asyncHandler(controller.addFavorite));
// آگهی را از نشان‌شده‌ها برمی‌دارد.
router.delete('/:listingId', asyncHandler(controller.removeFavorite));

module.exports = router;
