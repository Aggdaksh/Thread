'use strict';

/**
 * Password reset (OTP) routes. Mounted at /api/password.
 * POST /forgot, /verify, /reset — no auth required.
 */

const express = require('express');
const passwordController = require('../controllers/password.controller');
const { authLimiter } = require('../middleware/rateLimit.middleware');

const router = express.Router();

router.post('/forgot', authLimiter, passwordController.forgot);
router.post('/verify', authLimiter, passwordController.verify);
router.post('/reset', authLimiter, passwordController.reset);

// Dev-only: manual mail test endpoint. Prefer `npm run mail:test`.
if (process.env.NODE_ENV !== 'production' && process.env.ENABLE_DEV_MAIL_ROUTE === 'true') {
  router.post('/debug-mail', authLimiter, passwordController.debugMail);
}

module.exports = router;
