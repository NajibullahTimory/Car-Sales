const express = require('express');
const { asyncHandler } = require('../middleware/http');
const { requireAuth } = require('../middleware/auth');
const { createReport } = require('../controllers/reports.controller');

const router = express.Router();

// گزارش تخلف یک آگهی را از کاربر واردشده ثبت می‌کند.
router.post('/', requireAuth, asyncHandler(createReport));

module.exports = router;
