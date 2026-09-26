const InternalTransfer = require("../models/InternalTransfer");
const { ok, fail } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const nextReference = require("../utils/generateReference");
const { applyStockMovement } = require("../utils/stockService");

// POST /api/transfers  { fromLocation, toLocation, lines: [{product, quantity}], notes }
exports.createTransfer = asyncHandler(async (req, res) => {
  const { fromLocation, toLocation, lines, notes } = req.body;
  if (!fromLocation || !toLocation || !lines?.length) {
    return fail(res, "fromLocation, toLocation and at least one line are required.", 422);
  }
  if (fromLocation === toLocation) {
    return fail(res, "fromLocation and toLocation must be different.", 422);
  }

  const reference = await nextReference("IT");
  const transfer = await InternalTransfer.create({
    reference,
    fromLocation,
    toLocation,
    lines,
    notes,
    createdBy: req.user._id,
    status: "draft",
  });

  return ok(res, transfer, "Internal transfer created.", 201);
});

// GET /api/transfers?status=&page=&limit=
exports.listTransfers = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const transfers = await InternalTransfer.find(filter)
    .populate("fromLocation", "name code")
    .populate("toLocation", "name code")
    .populate("lines.product", "name sku uom")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await InternalTransfer.countDocuments(filter);
  return ok(res, { transfers, total, page: Number(page), limit: Number(limit) });
});

// GET /api/transfers/:id
exports.getTransfer = asyncHandler(async (req, res) => {
  const transfer = await InternalTransfer.findById(req.params.id)
    .populate("fromLocation", "name code")
    .populate("toLocation", "name code")
    .populate("lines.product", "name sku uom");
  if (!transfer) return fail(res, "Internal transfer not found.", 404);
  return ok(res, transfer);
});

// PUT /api/transfers/:id
exports.updateTransfer = asyncHandler(async (req, res) => {
  const transfer = await InternalTransfer.findById(req.params.id);
  if (!transfer) return fail(res, "Internal transfer not found.", 404);
  if (["done", "cancelled"].includes(transfer.status)) {
    return fail(res, `Cannot edit a transfer that is already ${transfer.status}.`, 400);
  }

  const { lines, notes, status } = req.body;
  if (lines) transfer.lines = lines;
  if (notes !== undefined) transfer.notes = notes;
  if (status && ["draft", "waiting", "ready"].includes(status)) transfer.status = status;

  await transfer.save();
  return ok(res, transfer, "Internal transfer updated.");
});

// POST /api/transfers/:id/validate
// Moves stock out of fromLocation and into toLocation. Total company-wide
// stock is unchanged — only the location changes, exactly as in the spec.
exports.validateTransfer = asyncHandler(async (req, res) => {
  const transfer = await InternalTransfer.findById(req.params.id);
  if (!transfer) return fail(res, "Internal transfer not found.", 404);
  if (transfer.status === "done") return fail(res, "Transfer already validated.", 400);
  if (transfer.status === "cancelled") return fail(res, "Cannot validate a cancelled transfer.", 400);

  for (const line of transfer.lines) {
    await applyStockMovement({
      product: line.product,
      location: transfer.fromLocation,
      changeQty: -line.quantity,
      movementType: "transfer_out",
      sourceDocType: "InternalTransfer",
      sourceDocId: transfer._id,
      sourceDocReference: transfer.reference,
      createdBy: req.user._id,
    });

    await applyStockMovement({
      product: line.product,
      location: transfer.toLocation,
      changeQty: line.quantity,
      movementType: "transfer_in",
      sourceDocType: "InternalTransfer",
      sourceDocId: transfer._id,
      sourceDocReference: transfer.reference,
      createdBy: req.user._id,
    });
  }

  transfer.status = "done";
  transfer.validatedAt = new Date();
  await transfer.save();

  return ok(res, transfer, "Transfer validated — stock moved between locations.");
});

// POST /api/transfers/:id/cancel
exports.cancelTransfer = asyncHandler(async (req, res) => {
  const transfer = await InternalTransfer.findById(req.params.id);
  if (!transfer) return fail(res, "Internal transfer not found.", 404);
  if (transfer.status === "done") return fail(res, "Cannot cancel a validated transfer.", 400);

  transfer.status = "cancelled";
  await transfer.save();
  return ok(res, transfer, "Internal transfer cancelled.");
});
