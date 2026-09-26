const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/authController");
const { protect } = require("../middleware/auth");

router.post("/signup", ctrl.signup);
router.post("/login", ctrl.login);
router.post("/forgot-password", ctrl.forgotPassword);
router.post("/verify-otp", ctrl.verifyOtp);
router.post("/reset-password", ctrl.resetPassword);
router.get("/me", protect, ctrl.me);

module.exports = router;
