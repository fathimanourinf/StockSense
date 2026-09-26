const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/transferController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/", ctrl.listTransfers);
router.post("/", ctrl.createTransfer);
router.get("/:id", ctrl.getTransfer);
router.put("/:id", ctrl.updateTransfer);
router.post("/:id/validate", ctrl.validateTransfer);
router.post("/:id/cancel", ctrl.cancelTransfer);

module.exports = router;
