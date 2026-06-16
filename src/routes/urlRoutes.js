const { Router } = require("express");
const urlController = require("../controllers/urlController");
const validateUrl = require("../middlewares/validateUrl");
const { authenticateToken, optionalAuthenticateToken } = require("../middlewares/authMiddleware");

const router = Router();

router.post("/shorten", optionalAuthenticateToken, validateUrl, urlController.createShortUrl);
router.get("/user", authenticateToken, urlController.getUserUrls);
router.get("/stats/:shortCode", urlController.getUrlStats);
router.get("/:shortCode", urlController.redirectToUrl);

module.exports = router;
