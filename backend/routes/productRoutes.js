const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/productController");
const { protect, requireRole } = require("../middleware/auth");

router.use(protect);

router.get("/", ctrl.listProducts);
router.post("/", requireRole("inventory_manager"), ctrl.createProduct);
router.get("/:id", ctrl.getProduct);
router.put("/:id", requireRole("inventory_manager"), ctrl.updateProduct);
router.delete("/:id", requireRole("inventory_manager"), ctrl.deactivateProduct);
router.get("/:id/availability", ctrl.getAvailability);

module.exports = router;
