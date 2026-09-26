const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/warehouseController");
const { protect, requireRole } = require("../middleware/auth");

router.use(protect);

router.get("/", ctrl.listWarehouses);
router.post("/", requireRole("inventory_manager"), ctrl.createWarehouse);
router.put("/:id", requireRole("inventory_manager"), ctrl.updateWarehouse);

router.get("/locations/all", ctrl.listLocations);
router.post("/locations", requireRole("inventory_manager"), ctrl.createLocation);

module.exports = router;
