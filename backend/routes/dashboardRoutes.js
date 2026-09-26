const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/dashboardController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/kpis", ctrl.getKpis);
router.get("/move-history", ctrl.getMoveHistory);
router.get("/low-stock", ctrl.getLowStockAlerts);

module.exports = router;
