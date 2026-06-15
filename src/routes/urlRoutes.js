const { Router } = require("express");
const urlController = require("../controllers/urlController");
const validateUrl = require("../middlewares/validateUrl");

const router = Router();

router.post("/shorten", validateUrl, urlController.createShortUrl);
router.get("/stats/:shortCode", urlController.getUrlStats);
router.get("/:shortCode", urlController.redirectToUrl);

module.exports = router;
