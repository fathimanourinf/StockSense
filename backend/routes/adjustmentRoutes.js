const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/adjustmentController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/", ctrl.listAdjustments);
router.post("/", ctrl.createAdjustment);
router.get("/:id", ctrl.getAdjustment);
router.post("/:id/validate", ctrl.validateAdjustment);
router.post("/:id/cancel", ctrl.cancelAdjustment);

module.exports = router;
