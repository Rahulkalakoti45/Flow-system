/* eslint-disable no-unused-vars */

// Central error handler. Keep it last in the middleware chain.
function errorHandler(err, req, res, next) {
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid id' });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Resource already exists' });
  }

  const status = err.status || 500;
  if (status >= 500) console.error(err);

  return res.status(status).json({
    message: status >= 500 ? 'Something went wrong' : err.message,
  });
}

function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

module.exports = { errorHandler, notFound };
