const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/categoryController");
const { protect, requireRole } = require("../middleware/auth");

router.use(protect);

router.get("/", ctrl.listCategories);
router.post("/", requireRole("inventory_manager"), ctrl.createCategory);
router.put("/:id", requireRole("inventory_manager"), ctrl.updateCategory);
router.delete("/:id", requireRole("inventory_manager"), ctrl.deleteCategory);

module.exports = router;
