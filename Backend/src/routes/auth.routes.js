const express = require('express');
const { asyncHandler } = require('../middleware/http');
const { requireAuth } = require('../middleware/auth');
const controller = require('../controllers/auth.controller');
const router = express.Router();

router.post('/register', asyncHandler(controller.register));
router.post('/login', asyncHandler(controller.login));
router.patch('/profile', requireAuth, asyncHandler(controller.updateProfile));
router.get('/me', requireAuth, asyncHandler(controller.getCurrentUser));

module.exports = router;
