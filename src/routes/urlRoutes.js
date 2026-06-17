const { Router } = require("express");
const urlController = require("../controllers/urlController");
const validateUrl = require("../middlewares/validateUrl");
const { authenticateToken, optionalAuthenticateToken } = require("../middlewares/authMiddleware");
const { redirectRateLimiter } = require("../middlewares/rateLimiter");

const router = Router();

/**
 * @swagger
 * /shorten:
 *   post:
 *     summary: Create a shortened URL
 *     tags: [URLs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 example: https://example.com/some/long/path
 *               customAlias:
 *                 type: string
 *               expiresIn:
 *                 description: "Relative expiry: a preset (7d, 30d, 90d) or a number of days. Use null to clear."
 *                 oneOf:
 *                   - type: string
 *                     enum: [7d, 30d, 90d]
 *                   - type: integer
 *                 example: 7d
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: "Absolute expiry as an ISO-8601 timestamp in the future. Mutually exclusive with expiresIn."
 *                 example: 2026-12-31T23:59:59.000Z
 *     responses:
 *       201:
 *         description: URL successfully shortened
 *       400:
 *         description: Invalid input
 */
router.post("/shorten", optionalAuthenticateToken, validateUrl, urlController.createShortUrl);

/**
 * @swagger
 * /user:
 *   get:
 *     summary: Get all URLs created by the current user
 *     tags: [URLs]
 *     responses:
 *       200:
 *         description: List of URLs
 *       401:
 *         description: Unauthorized
 */
router.get("/user", authenticateToken, urlController.getUserUrls);

/**
 * @swagger
 * /urls/{id}/analytics:
 *   get:
 *     summary: Get detailed analytics for a specific URL
 *     tags: [Analytics]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detailed analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalClicks:
 *                       type: integer
 *                     uniqueVisitors:
 *                       type: integer
 *                       description: Distinct IP addresses that have clicked the link.
 *                     lastAccessed:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     dailyClicks:
 *                       type: integer
 *                       description: Clicks in the last 24 hours.
 *                     weeklyClicks:
 *                       type: integer
 *                       description: Clicks in the last 7 days.
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     clickHistory:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: URL not found or unauthorized
 */
router.get("/urls/:id/analytics", authenticateToken, urlController.getUrlAnalytics);

/**
 * @swagger
 * /urls/{id}/qrcode:
 *   get:
 *     summary: Get a QR code for a shortened URL
 *     description: Returns a base64 PNG data URL by default, or the raw PNG image with ?format=png.
 *     tags: [URLs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: format
 *         required: false
 *         schema:
 *           type: string
 *           enum: [png]
 *         description: When set to "png", responds with an image/png body instead of JSON.
 *     responses:
 *       200:
 *         description: QR code (JSON base64 data URL, or image/png)
 *       400:
 *         description: Invalid URL id
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: URL not found or unauthorized
 */
router.get("/urls/:id/qrcode", authenticateToken, urlController.getQrCode);

/**
 * @swagger
 * /urls/{id}/expiration:
 *   patch:
 *     summary: Set, change, or clear the expiration of a URL
 *     tags: [URLs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               expiresIn:
 *                 description: "Preset (7d, 30d, 90d) or number of days. Send null to clear expiration."
 *                 oneOf:
 *                   - type: string
 *                     enum: [7d, 30d, 90d]
 *                   - type: integer
 *                   - type: 'null'
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: "Absolute ISO-8601 expiry in the future. Send null to clear. Mutually exclusive with expiresIn."
 *     responses:
 *       200:
 *         description: Expiration updated
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: URL not found or unauthorized
 */
router.patch("/urls/:id/expiration", authenticateToken, urlController.updateExpiration);

/**
 * @swagger
 * /urls/{id}:
 *   delete:
 *     summary: Delete a URL owned by the current user
 *     tags: [URLs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: URL deleted
 *       400:
 *         description: Invalid URL id
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: URL not found or unauthorized
 */
router.delete("/urls/:id", authenticateToken, urlController.deleteUrl);

/**
 * @swagger
 * /analytics/top-urls:
 *   get:
 *     summary: Get top clicked URLs for the current user
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: List of top URLs with their click counts
 *       401:
 *         description: Unauthorized
 */
router.get("/analytics/top-urls", authenticateToken, urlController.getTopUrls);

/**
 * @swagger
 * /stats/{shortCode}:
 *   get:
 *     summary: Get stats for a shortened URL
 *     tags: [URLs]
 *     parameters:
 *       - in: path
 *         name: shortCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: URL statistics
 *       404:
 *         description: URL not found
 */
router.get("/stats/:shortCode", urlController.getUrlStats);

/**
 * @swagger
 * /{shortCode}:
 *   get:
 *     summary: Redirect to the original URL
 *     tags: [URLs]
 *     parameters:
 *       - in: path
 *         name: shortCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Redirect to the original URL
 *       404:
 *         description: URL not found
 *       410:
 *         description: URL has expired
 */
router.get("/:shortCode", redirectRateLimiter, urlController.redirectToUrl);

module.exports = router;
