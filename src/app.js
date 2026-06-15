const express = require("express");
const urlRoutes = require("./routes/urlRoutes");
const errorHandler = require("./middlewares/errorHandler");
const notFound = require("./middlewares/notFound");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("URL Shortener API is running");
});

app.use("/", urlRoutes);

app.use(notFound);

app.use(errorHandler);

module.exports = app;
