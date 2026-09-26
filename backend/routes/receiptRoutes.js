const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/receiptController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/", ctrl.listReceipts);
router.post("/", ctrl.createReceipt);
router.get("/:id", ctrl.getReceipt);
router.put("/:id", ctrl.updateReceipt);
router.post("/:id/validate", ctrl.validateReceipt);
router.post("/:id/cancel", ctrl.cancelReceipt);

module.exports = router;
