# Advanced URL Shortener API

A robust, production-ready URL shortener service built with Express.js, Prisma ORM, and PostgreSQL. It features user authentication, URL analytics, request rate limiting, and extensive testing capabilities.

## 🚀 Features

- **URL Shortening**: Generate concise, unique short links using `nanoid`.
- **User Authentication**: Secure registration and login flow using JWT and `bcrypt`.
- **Analytics & Tracking**: Track link usage and view detailed statistics.
- **Security**: Built-in rate limiting (`express-rate-limit`) to prevent abuse and brute-force attacks.
- **Database**: PostgreSQL integration managed via Prisma ORM for type-safe database interactions.
- **Testing**: Comprehensive test suites powered by Jest and Supertest.

---

## 🛠️ Tech Stack

- **Framework:** Node.js, Express 5.x
- **Database:** PostgreSQL
- **ORM:** Prisma 7
- **Authentication:** JSON Web Tokens (JWT), bcrypt
- **Utilities:** nanoid (ID generation), dotenv (Environment management)
- **Testing:** Jest, Supertest

---

## 📂 Project Structure

```text
├── prisma/                  # Database schema definitions and migrations
├── src/                     # Main source code directory
│   ├── app.js               # Express application setup and middleware
│   ├── config/              # Configuration files
│   ├── controllers/         # Request handlers (auth, urls)
│   ├── middlewares/         # Custom middlewares (auth, rate limiting, validation)
│   ├── routes/              # API route definitions
│   ├── services/            # Core business logic
│   ├── utils/               # Reusable utility functions
│   └── validators/          # Data validation schemas
├── tests/                   # Automated test suites
├── db.js                    # Database connection script
└── server.js                # Application entry point
```

---

## 💻 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [PostgreSQL](https://www.postgresql.org/) database (local or cloud-hosted)

### Installation

1. **Clone the repository and install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Configuration:**
   Copy the example environment file and update it with your configuration (e.g., your PostgreSQL connection string and JWT secret).
   ```bash
   cp .env.example .env
   ```

3. **Database Setup:**
   Run Prisma migrations to create the required tables in your database.
   ```bash
   npx prisma migrate dev
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   *The server will start using nodemon, automatically reloading upon file changes.*

### Running Tests

To execute the Jest test suite:
```bash
npm test
```

---

## 📡 API Reference

### Authentication Routes

- **Register a new user:**
  `POST /auth/register`
  *Body:* `{ "email": "user@example.com", "password": "securepassword" }`

- **Log in:**
  `POST /auth/login`
  *Body:* `{ "email": "user@example.com", "password": "securepassword" }`
  *Returns:* A JWT token for authenticated requests.

### URL Routes

- **Shorten a URL:**
  `POST /shorten`
  *Body:* `{ "url": "https://example.com" }`
  *Headers (Optional):* `Authorization: Bearer <token>` to link the URL to a user.
  *Returns:* `{ "shortCode": "abc12", "shortUrl": "http://localhost:3000/abc12" }`

- **Get User's URLs (Requires Auth):**
  `GET /user`
  *Headers:* `Authorization: Bearer <token>`
  *Returns:* List of URLs created by the authenticated user.

- **Get URL Statistics:**
  `GET /stats/:shortCode`
  *Returns:* Analytics data for the specified short code.

- **Redirect to Original URL:**
  `GET /:shortCode`
  *Action:* Redirects the client to the original long URL.
