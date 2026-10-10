const { validationResult } = require('express-validator');

/** Turns express-validator errors into a 400 response with a field map. */
function handleValidation(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
  return res.status(400).json({ message: 'Validation failed', errors });
}

module.exports = { handleValidation };
