function errorMiddleware(err, _req, res, _next) {
  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal server error'

  if (statusCode >= 500) {
    // Log internal errors for debugging while keeping response generic.
    console.error(err)
  }

  return res.status(statusCode).json({ message })
}

module.exports = errorMiddleware
