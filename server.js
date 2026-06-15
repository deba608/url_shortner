const express = require("express");
require("dotenv").config();
const { nanoid } = require("nanoid");
const prisma = require("./db");

const app = express();

// Middleware
app.use(express.json());


// Home Route
app.get("/", (req, res) => {
    res.send("URL Shortener API is running");
});


// Create Short URL
app.post("/shorten", async (req, res) => {
    try {
        const { url } = req.body;

        try {
            new URL(url);
        } catch {
            return res.status(400).json({
                message: "Invalid URL"
            });
        }

        // Validation
        if (!url) {
            return res.status(400).json({
                message: "URL is required"
            });
        }

        const shortCode = nanoid(6);

        await prisma.url.create({
            data: {
                originalUrl: url,
                shortCode: shortCode
            }
        });

        res.status(201).json({
            shortCode,
            shortUrl: `http://localhost:3000/${shortCode}`
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Internal Server Error"
        });
    }
});


// Redirect Route
app.get("/:shortCode", async (req, res) => {
    try {
        const { shortCode } = req.params;

        const url = await prisma.url.findUnique({
            where: {
                shortCode: shortCode
            }
        });

        if (!url) {
            return res.status(404).json({
                message: "Short URL not found"
            });
        }

        res.redirect(url.originalUrl);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Internal Server Error"
        });
    }
});


// Start Server
app.listen(3000, () => {
    console.log("Server running on port 3000");
});