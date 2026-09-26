const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/deliveryController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/", ctrl.listDeliveries);
router.post("/", ctrl.createDelivery);
router.get("/:id", ctrl.getDelivery);
router.put("/:id", ctrl.updateDelivery);
router.post("/:id/validate", ctrl.validateDelivery);
router.post("/:id/cancel", ctrl.cancelDelivery);

module.exports = router;
