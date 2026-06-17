# Migrate to Google OAuth

This plan outlines the steps to remove the current Clerk and OTP-based authentication system and replace it with a custom Google OAuth flow using JWTs stored in HttpOnly cookies.

## Open Questions

> [!IMPORTANT]
> **Database Reset:** Changing the `userId` in the `Url` model to relate to a new `User` model will require dropping existing tables or running a migration that deletes orphaned URLs (since old `userId`s were Clerk strings, and the new ones will likely be Prisma UUIDs or integers). Can we reset the database, or do we need a complex migration strategy? (Assuming we can reset for now).
> **Google Client ID:** You will need to provide a Google Client ID in the `.env` files for both frontend and backend to make this work. I will add placeholders.

## Proposed Changes

---

### Backend

#### [NEW] `package.json` dependencies
- Install `google-auth-library` and `jsonwebtoken`
- Uninstall `@clerk/express`

#### [MODIFY] `prisma/schema.prisma`
- Add a new `User` model (id, email, name, avatar, googleId).
- Update the `Url` model to relation to the `User` model.

#### [NEW] `src/controllers/authController.js`
- Create `googleLogin` endpoint: Takes a Google credential token, verifies it using `google-auth-library`, finds/creates a user, signs a JWT, and sets it in an `HttpOnly` cookie.
- Create `logout` endpoint: Clears the auth cookie.
- Create `me` endpoint: Returns the currently authenticated user's details.

#### [MODIFY] `src/middlewares/authMiddleware.js`
- Replace Clerk's `requireAuth` with a custom JWT verification middleware that reads from `req.cookies`.

#### [MODIFY] `src/app.js`
- Remove `@clerk/express` usage.
- Register the new `authRoutes.js`.

#### [NEW] `src/routes/authRoutes.js`
- Set up `/api/auth/google`, `/api/auth/logout`, `/api/auth/me`.

#### [MODIFY] `src/controllers/urlController.js`
- Update `req.auth.userId` references to `req.user.id` (populated by our new auth middleware).

---

### Frontend

#### [NEW] `package.json` dependencies
- Install `@react-oauth/google`
- Uninstall `@clerk/react`

#### [MODIFY] `frontend/src/main.jsx`
- Replace `<ClerkProvider>` with `<GoogleOAuthProvider>`.

#### [MODIFY] `frontend/src/api/axiosClient.js`
- Remove `window.Clerk.session.getToken()` logic.
- Ensure `withCredentials: true` is set so cookies are sent automatically.
- Keep the 401 interceptor to redirect to `/login`.

#### [MODIFY] `frontend/src/hooks/useAuth.js`
- Rewrite to manage local state (`user`, `isAuthenticated`, `initializing`).
- Fetch `/api/auth/me` on mount to check session.
- Expose `loginWithGoogle` and `logout` functions.

#### [MODIFY] `frontend/src/pages/Login.jsx`
- Complete redesign as per the user's requirements.
- Remove all inputs.
- Add "Continue with Google" button using `@react-oauth/google`.

#### [DELETE] `frontend/src/pages/Register.jsx`
#### [DELETE] `frontend/src/pages/VerifyOtp.jsx`
#### [DELETE] `frontend/src/pages/ForgotPassword.jsx`
#### [DELETE] `frontend/src/pages/ResetPassword.jsx`
#### [DELETE] `frontend/src/components/ui/OtpInput.jsx`

#### [MODIFY] `frontend/src/routes/AppRoutes.jsx`
- Remove all deleted routes.
- Update `PublicOnly` wrapper for the new single `/login` page.

#### [MODIFY] `frontend/src/routes/ProtectedRoute.jsx`
- Update to use the new `useAuth` hook.

## Verification Plan

### Automated Tests
- Run `npm run dev` in both backend and frontend.
- Check for any compilation or linting errors.

### Manual Verification
- Test unauthenticated access redirects to `/login`.
- Test Google OAuth flow (requires setting up a Google OAuth app and adding the Client ID).
- Verify the Dashboard shows the user's name, email, and avatar.
- Verify creating and managing URLs still works with the new user association.
- Verify logging out clears the cookie and redirects to `/login`.
