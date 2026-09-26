const { fail } = require("../utils/apiResponse");

// Central error handler — catches anything passed to next(err) or thrown in async routes.
module.exports = (err, req, res, next) => {
  console.error(err);

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    return fail(res, `Duplicate value for field: ${field}`, 409);
  }
  if (err.name === "ValidationError") {
    return fail(res, "Validation failed.", 422, err.errors);
  }
  if (err.name === "CastError") {
    return fail(res, `Invalid id: ${err.value}`, 400);
  }

  return fail(res, err.message || "Server error.", err.statusCode || 500);
};
