// Errors
function notFound(_req, res) {
  res.status(404).json({ message: "Route not found." });
}

function errorHandler(error, _req, res, _next) {
  console.error(error);

  if (error.type === "entity.too.large") {
    return res.status(413).json({ message: "The image upload is too large." });
  }

  if (error.code === "22P02" || error.code === "23503") {
    return res.status(400).json({ message: "Invalid input value." });
  }

  const status = Number.isInteger(error.status) ? error.status : 500;
  const message =
    status === 500 && process.env.NODE_ENV === "production"
      ? "An unexpected server error occurred."
      : error.message;

  return res.status(status).json({ message });
}

module.exports = { notFound, errorHandler };
