const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  if (process.env.NODE_ENV === "development") {
    console.error(`[ERROR] ${statusCode} - ${message}`);
    console.error(err.stack);
  }

  const body = {
    status: "error",
    statusCode,
    message,
  };

  if (err.suggestions) {
    body.suggestions = err.suggestions;
  }

  res.status(statusCode).json(body);
};

module.exports = errorHandler;
