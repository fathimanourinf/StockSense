const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Otp = require("../models/Otp");
const { ok, fail } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { generateOtpCode, sendOtpEmail } = require("../utils/otp");

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

// POST /api/auth/signup
exports.signup = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return fail(res, "Name, email and password are required.", 422);
  }

  const existing = await User.findOne({ email });
  if (existing) return fail(res, "An account with this email already exists.", 409);

  const user = await User.create({ name, email, password, role });
  const token = signToken(user);

  return ok(
    res,
    { token, user: { id: user._id, name: user.name, email: user.email, role: user.role } },
    "Account created.",
    201
  );
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return fail(res, "Email and password are required.", 422);

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    return fail(res, "Invalid email or password.", 401);
  }

  const token = signToken(user);
  // This is what the frontend uses to redirect straight to the dashboard.
  return ok(res, {
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    redirectTo: "/dashboard",
  });
});

// POST /api/auth/forgot-password  { email }
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  // Don't reveal whether the email exists — respond the same way either way.
  if (!user) return ok(res, null, "If that email exists, an OTP has been sent.");

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + (Number(process.env.OTP_EXPIRES_MIN) || 10) * 60 * 1000);
  await Otp.create({ email, code, expiresAt });
  await sendOtpEmail(email, code);

  return ok(res, null, "If that email exists, an OTP has been sent.");
});

// POST /api/auth/verify-otp  { email, code }
exports.verifyOtp = asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  const otp = await Otp.findOne({ email, code, used: false }).sort({ createdAt: -1 });
  if (!otp || otp.expiresAt < new Date()) {
    return fail(res, "Invalid or expired OTP.", 400);
  }
  otp.used = true;
  await otp.save();
  return ok(res, { verified: true }, "OTP verified. You may now reset your password.");
});

// POST /api/auth/reset-password  { email, code, newPassword }
exports.resetPassword = asyncHandler(async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return fail(res, "New password must be at least 6 characters.", 422);
  }

  const otp = await Otp.findOne({ email, code, used: true }).sort({ createdAt: -1 });
  if (!otp) {
    return fail(res, "Please verify your OTP before resetting the password.", 400);
  }

  const user = await User.findOne({ email });
  if (!user) return fail(res, "No account found for this email.", 404);

  user.password = newPassword;
  await user.save();

  return ok(res, null, "Password reset successfully. You can now log in.");
});

// GET /api/auth/me
exports.me = asyncHandler(async (req, res) => {
  return ok(res, {
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
  });
});
