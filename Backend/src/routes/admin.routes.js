const express = require("express");
const { asyncHandler } = require("../middleware/http");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const listingController = require("../controllers/admin/listings.controller");
const userController = require("../controllers/admin/users.controller");
const activityController = require("../controllers/admin/activity.controller");
const router = express.Router();

// این برای مدیر ها است
router.use(requireAuth, requireAdmin);
router.get("/stats", asyncHandler(activityController.getStats));
router.get("/listings", asyncHandler(listingController.listListings));
router.patch(
  "/listings/:id/status",
  asyncHandler(listingController.updateListingStatus),
);
router.delete("/listings/:id", asyncHandler(listingController.deleteListing));
router.get("/users", asyncHandler(userController.listUsers));
router.patch("/users/:id/block", asyncHandler(userController.setUserBlocked));
router.post("/users/:id/warn", asyncHandler(userController.warnUser));
router.delete("/users/:id", asyncHandler(userController.deleteUser));
router.get("/messages", asyncHandler(activityController.listMessages));
router.delete("/messages/:id", asyncHandler(activityController.deleteMessage));
router.get("/reports", asyncHandler(activityController.listReports));
router.patch("/reports/:id", asyncHandler(activityController.updateReport));
router.get("/audit-logs", asyncHandler(activityController.listAuditLogs));

module.exports = router;
