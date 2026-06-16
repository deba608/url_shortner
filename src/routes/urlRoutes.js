const { Router } = require("express");
const urlController = require("../controllers/urlController");
const validateUrl = require("../middlewares/validateUrl");
const { authenticateToken, optionalAuthenticateToken } = require("../middlewares/authMiddleware");

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
 *               customAlias:
 *                 type: string
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
 *         description: Detailed analytics data including click history
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: URL not found or unauthorized
 */
router.get("/urls/:id/analytics", authenticateToken, urlController.getUrlAnalytics);

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
 */
router.get("/:shortCode", urlController.redirectToUrl);

module.exports = router;
