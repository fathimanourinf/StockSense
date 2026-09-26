const StockAdjustment = require("../models/StockAdjustment");
const StockItem = require("../models/StockItem");
const { ok, fail } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const nextReference = require("../utils/generateReference");
const { applyStockMovement } = require("../utils/stockService");

// POST /api/adjustments  { location, reason, lines: [{product, countedQty}] }
// systemQty and diff are computed server-side so they can't be spoofed.
exports.createAdjustment = asyncHandler(async (req, res) => {
  const { location, reason, lines } = req.body;
  if (!location || !lines?.length) {
    return fail(res, "location and at least one line are required.", 422);
  }

  const enrichedLines = [];
  for (const line of lines) {
    const stockItem = await StockItem.findOne({ product: line.product, location });
    const systemQty = stockItem ? stockItem.quantity : 0;
    const countedQty = line.countedQty;
    enrichedLines.push({ product: line.product, systemQty, countedQty, diff: countedQty - systemQty });
  }

  const reference = await nextReference("ADJ");
  const adjustment = await StockAdjustment.create({
    reference,
    location,
    reason,
    lines: enrichedLines,
    createdBy: req.user._id,
    status: "draft",
  });

  return ok(res, adjustment, "Stock adjustment created.", 201);
});

// GET /api/adjustments?status=&location=&page=&limit=
exports.listAdjustments = asyncHandler(async (req, res) => {
  const { status, location, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (location) filter.location = location;

  const adjustments = await StockAdjustment.find(filter)
    .populate("location", "name code")
    .populate("lines.product", "name sku uom")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await StockAdjustment.countDocuments(filter);
  return ok(res, { adjustments, total, page: Number(page), limit: Number(limit) });
});

// GET /api/adjustments/:id
exports.getAdjustment = asyncHandler(async (req, res) => {
  const adjustment = await StockAdjustment.findById(req.params.id)
    .populate("location", "name code")
    .populate("lines.product", "name sku uom");
  if (!adjustment) return fail(res, "Stock adjustment not found.", 404);
  return ok(res, adjustment);
});

// POST /api/adjustments/:id/validate -> applies the diff to stock, marks as done
exports.validateAdjustment = asyncHandler(async (req, res) => {
  const adjustment = await StockAdjustment.findById(req.params.id);
  if (!adjustment) return fail(res, "Stock adjustment not found.", 404);
  if (adjustment.status === "done") return fail(res, "Adjustment already validated.", 400);
  if (adjustment.status === "cancelled") {
    return fail(res, "Cannot validate a cancelled adjustment.", 400);
  }

  for (const line of adjustment.lines) {
    if (line.diff === 0) continue; // no discrepancy, nothing to log
    await applyStockMovement({
      product: line.product,
      location: adjustment.location,
      changeQty: line.diff, // positive = found extra stock, negative = damaged/missing
      movementType: "adjustment",
      sourceDocType: "StockAdjustment",
      sourceDocId: adjustment._id,
      sourceDocReference: adjustment.reference,
      createdBy: req.user._id,
    });
  }

  adjustment.status = "done";
  adjustment.validatedAt = new Date();
  await adjustment.save();

  return ok(res, adjustment, "Adjustment validated — stock corrected.");
});

// POST /api/adjustments/:id/cancel
exports.cancelAdjustment = asyncHandler(async (req, res) => {
  const adjustment = await StockAdjustment.findById(req.params.id);
  if (!adjustment) return fail(res, "Stock adjustment not found.", 404);
  if (adjustment.status === "done") return fail(res, "Cannot cancel a validated adjustment.", 400);

  adjustment.status = "cancelled";
  await adjustment.save();
  return ok(res, adjustment, "Stock adjustment cancelled.");
});
