const { Router } = require("express");
const authController = require("../controllers/authController");
const { authenticateToken } = require("../middlewares/authMiddleware");

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Registration, OTP verification, login, and password reset
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new account (sends an email-verification OTP)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 6 }
 *     responses:
 *       201: { description: OTP sent; account pending verification }
 *       409: { description: Email already registered and verified }
 */
router.post("/register", authController.register);

/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     summary: Verify the signup OTP and activate the account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code]
 *             properties:
 *               email: { type: string }
 *               code: { type: string, example: "123456" }
 *     responses:
 *       200: { description: Verified; session cookie set }
 *       400: { description: Invalid or expired code }
 */
router.post("/verify-otp", authController.verifyEmail);

/**
 * @swagger
 * /auth/resend-otp:
 *   post:
 *     summary: Re-send the email-verification OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string }
 *     responses:
 *       200: { description: New code sent }
 *       429: { description: Resend requested too soon }
 */
router.post("/resend-otp", authController.resendVerification);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in (sets an HTTP-only session cookie)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Logged in }
 *       401: { description: Invalid credentials }
 *       403: { description: Email not verified (requiresVerification) }
 */
router.post("/login", authController.login);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request a password-reset OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string }
 *     responses:
 *       200: { description: Generic success (no account enumeration) }
 */
router.post("/forgot-password", authController.forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using a valid OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code, newPassword]
 *             properties:
 *               email: { type: string }
 *               code: { type: string }
 *               newPassword: { type: string, minLength: 6 }
 *     responses:
 *       200: { description: Password reset; session cookie set }
 *       400: { description: Invalid or expired code }
 */
router.post("/reset-password", authController.resetPassword);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get the currently authenticated user
 *     tags: [Auth]
 *     responses:
 *       200: { description: Current user }
 *       401: { description: Not authenticated }
 */
router.get("/me", authenticateToken, authController.me);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out (clears the session cookie)
 *     tags: [Auth]
 *     responses:
 *       200: { description: Logged out }
 */
router.post("/logout", authController.logout);

module.exports = router;
