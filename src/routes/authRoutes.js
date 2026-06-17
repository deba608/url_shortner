const { Router } = require("express");
const authController = require("../controllers/authController");
const { authenticateToken } = require("../middlewares/authMiddleware");

const router = Router();

router.post("/google", authController.googleLogin);
router.post("/logout", authController.logout);
router.get("/me", authenticateToken, authController.me);

module.exports = router;
