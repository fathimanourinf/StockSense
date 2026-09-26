const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { fail } = require("../utils/apiResponse");

// Verifies the JWT and attaches req.user
exports.protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return fail(res, "Not authenticated. Missing token.", 401);
    }
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return fail(res, "User no longer exists.", 401);

    req.user = user;
    next();
  } catch (err) {
    return fail(res, "Invalid or expired token.", 401);
  }
};

// Restricts a route to specific roles, e.g. requireRole("inventory_manager")
exports.requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return fail(res, "You don't have permission to perform this action.", 403);
    }
    next();
  };
