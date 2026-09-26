// Small helpers so every response has the same shape.
exports.ok = (res, data, message = "Success", status = 200) =>
  res.status(status).json({ success: true, message, data });

exports.fail = (res, message = "Something went wrong", status = 400, errors = null) =>
  res.status(status).json({ success: false, message, errors });
