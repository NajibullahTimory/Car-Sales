const express = require("express");
const { asyncHandler } = require("../middleware/http");
const { requireAuth } = require("../middleware/auth");
const controller = require("../controllers/messages.controller");

const router = express.Router();

// همهٔ عملیات پیام به کاربر احراز هویت‌شده تعلق دارد.
router.use(requireAuth);
// فهرست همهٔ پیام‌های کاربر را برای ساخت گفتگوها می‌دهد.
router.get("/", asyncHandler(controller.listMessages));
// پیام‌های خوانده‌نشده را برای اعلان‌ها می‌دهد.
router.get("/unread", asyncHandler(controller.listUnreadMessages));
// پیام تازه را به یک عضو دیگر می‌فرستد.
router.post("/", asyncHandler(controller.createMessage));
// زمان خواندن پیام دریافتی را ثبت می‌کند.
router.patch("/:id/read", asyncHandler(controller.markMessageRead));

module.exports = router;
