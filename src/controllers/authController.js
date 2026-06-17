const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const prisma = require("../config/database");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-dev";

const googleLogin = async (req, res, next) => {
  try {
    const { credential, access_token } = req.body;

    let email, name, avatar, googleId;

    if (access_token) {
      // Implicit flow: verify access_token via Google's userinfo endpoint using Node https
      const userInfo = await new Promise((resolve, reject) => {
        const https = require("https");
        const options = {
          hostname: "www.googleapis.com",
          path: "/oauth2/v3/userinfo",
          headers: { Authorization: `Bearer ${access_token}` },
        };
        https.get(options, (resp) => {
          let data = "";
          resp.on("data", (chunk) => { data += chunk; });
          resp.on("end", () => {
            if (resp.statusCode !== 200) {
              reject(new Error("Invalid Google access token"));
            } else {
              resolve(JSON.parse(data));
            }
          });
        }).on("error", reject);
      });
      email = userInfo.email;
      name = userInfo.name;
      avatar = userInfo.picture;
      googleId = userInfo.sub;
    } else if (credential) {
      // ID token flow: verify via google-auth-library
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      email = payload.email;
      name = payload.name;
      avatar = payload.picture;
      googleId = payload.sub;
    } else {
      return res.status(400).json({ error: "Missing credential or access_token" });
    }

    // Find or create user
    let user = await prisma.user.findUnique({ where: { googleId } });
    if (!user) {
      user = await prisma.user.create({ data: { googleId, email, name, avatar } });
    } else {
      // Update avatar/name in case they changed on Google
      user = await prisma.user.update({
        where: { googleId },
        data: { avatar, name },
      });
    }

    // Create JWT
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" });

    // Set HttpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      message: "Authentication successful",
      user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar },
    });
  } catch (error) {
    next(error);
  }
};

const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
  res.status(200).json({ message: "Logged out successfully" });
};

const me = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, avatar: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  googleLogin,
  logout,
  me,
};
