const Receipt = require("../models/Receipt");
const { ok, fail } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const nextReference = require("../utils/generateReference");
const { applyStockMovement } = require("../utils/stockService");

// POST /api/receipts   { supplier, location, lines: [{product, expectedQty}], notes }
exports.createReceipt = asyncHandler(async (req, res) => {
  const { supplier, location, lines, notes } = req.body;
  if (!supplier || !location || !lines?.length) {
    return fail(res, "supplier, location and at least one line are required.", 422);
  }

  const reference = await nextReference("RCPT");
  const receipt = await Receipt.create({
    reference,
    supplier,
    location,
    lines,
    notes,
    createdBy: req.user._id,
    status: "draft",
  });

  return ok(res, receipt, "Receipt created.", 201);
});

// GET /api/receipts?status=&location=&page=&limit=
exports.listReceipts = asyncHandler(async (req, res) => {
  const { status, location, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (location) filter.location = location;

  const receipts = await Receipt.find(filter)
    .populate("location", "name code")
    .populate("lines.product", "name sku uom")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Receipt.countDocuments(filter);
  return ok(res, { receipts, total, page: Number(page), limit: Number(limit) });
});

// GET /api/receipts/:id
exports.getReceipt = asyncHandler(async (req, res) => {
  const receipt = await Receipt.findById(req.params.id)
    .populate("location", "name code")
    .populate("lines.product", "name sku uom");
  if (!receipt) return fail(res, "Receipt not found.", 404);
  return ok(res, receipt);
});

// PUT /api/receipts/:id   (only while draft/waiting — edit lines, quantities received)
exports.updateReceipt = asyncHandler(async (req, res) => {
  const receipt = await Receipt.findById(req.params.id);
  if (!receipt) return fail(res, "Receipt not found.", 404);
  if (["done", "cancelled"].includes(receipt.status)) {
    return fail(res, `Cannot edit a receipt that is already ${receipt.status}.`, 400);
  }

  const { supplier, lines, notes, status } = req.body;
  if (supplier) receipt.supplier = supplier;
  if (lines) receipt.lines = lines;
  if (notes !== undefined) receipt.notes = notes;
  if (status && ["draft", "waiting", "ready"].includes(status)) receipt.status = status;

  await receipt.save();
  return ok(res, receipt, "Receipt updated.");
});

// POST /api/receipts/:id/validate  -> increases stock, marks as done
exports.validateReceipt = asyncHandler(async (req, res) => {
  const receipt = await Receipt.findById(req.params.id);
  if (!receipt) return fail(res, "Receipt not found.", 404);
  if (receipt.status === "done") return fail(res, "Receipt already validated.", 400);
  if (receipt.status === "cancelled") return fail(res, "Cannot validate a cancelled receipt.", 400);

  for (const line of receipt.lines) {
    const qty = line.receivedQty > 0 ? line.receivedQty : line.expectedQty;
    line.receivedQty = qty;

    await applyStockMovement({
      product: line.product,
      location: receipt.location,
      changeQty: qty, // Receiving stock always increases it
      movementType: "receipt",
      sourceDocType: "Receipt",
      sourceDocId: receipt._id,
      sourceDocReference: receipt.reference,
      createdBy: req.user._id,
    });
  }

  receipt.status = "done";
  receipt.validatedAt = new Date();
  await receipt.save();

  return ok(res, receipt, "Receipt validated — stock updated.");
});

// POST /api/receipts/:id/cancel
exports.cancelReceipt = asyncHandler(async (req, res) => {
  const receipt = await Receipt.findById(req.params.id);
  if (!receipt) return fail(res, "Receipt not found.", 404);
  if (receipt.status === "done") return fail(res, "Cannot cancel a validated receipt.", 400);

  receipt.status = "cancelled";
  await receipt.save();
  return ok(res, receipt, "Receipt cancelled.");
});
