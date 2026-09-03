const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Server error",
    details: err.details,
    responseBody: err.details,
  });
};

module.exports = errorHandler;
