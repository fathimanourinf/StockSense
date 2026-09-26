const DeliveryOrder = require("../models/DeliveryOrder");
const { ok, fail } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const nextReference = require("../utils/generateReference");
const { applyStockMovement } = require("../utils/stockService");

exports.createDelivery = asyncHandler(async (req, res) => {
  const { customer, location, lines, notes } = req.body;
  if (!customer || !location || !lines?.length) {
    return fail(res, "customer, location and at least one line are required.", 422);
  }

  const reference = await nextReference("DO");
  const delivery = await DeliveryOrder.create({
    reference,
    customer,
    location,
    lines,
    notes,
    createdBy: req.user._id,
    status: "draft",
  });

  return ok(res, delivery, "Delivery order created.", 201);
});

exports.listDeliveries = asyncHandler(async (req, res) => {
  const { status, location, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (location) filter.location = location;

  const deliveries = await DeliveryOrder.find(filter)
    .populate("location", "name code")
    .populate("lines.product", "name sku uom")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await DeliveryOrder.countDocuments(filter);
  return ok(res, { deliveries, total, page: Number(page), limit: Number(limit) });
});

exports.getDelivery = asyncHandler(async (req, res) => {
  const delivery = await DeliveryOrder.findById(req.params.id)
    .populate("location", "name code")
    .populate("lines.product", "name sku uom");
  if (!delivery) return fail(res, "Delivery order not found.", 404);
  return ok(res, delivery);
});

exports.updateDelivery = asyncHandler(async (req, res) => {
  const delivery = await DeliveryOrder.findById(req.params.id);
  if (!delivery) return fail(res, "Delivery order not found.", 404);
  if (["done", "cancelled"].includes(delivery.status)) {
    return fail(res, `Cannot edit a delivery that is already ${delivery.status}.`, 400);
  }

  const { customer, lines, notes, status } = req.body;
  if (customer) delivery.customer = customer;
  if (lines) delivery.lines = lines;
  if (notes !== undefined) delivery.notes = notes;
  if (status && ["draft", "waiting", "ready"].includes(status)) delivery.status = status;

  await delivery.save();
  return ok(res, delivery, "Delivery order updated.");
});

exports.validateDelivery = asyncHandler(async (req, res) => {
  const delivery = await DeliveryOrder.findById(req.params.id);
  if (!delivery) return fail(res, "Delivery order not found.", 404);
  if (delivery.status === "done") return fail(res, "Delivery already validated.", 400);
  if (delivery.status === "cancelled") return fail(res, "Cannot validate a cancelled delivery.", 400);

  for (const line of delivery.lines) {
    const qty = line.deliveredQty > 0 ? line.deliveredQty : line.orderedQty;
    line.deliveredQty = qty;

    await applyStockMovement({
      product: line.product,
      location: delivery.location,
      changeQty: -qty,
      movementType: "delivery",
      sourceDocType: "DeliveryOrder",
      sourceDocId: delivery._id,
      sourceDocReference: delivery.reference,
      createdBy: req.user._id,
    });
  }

  delivery.status = "done";
  delivery.validatedAt = new Date();
  await delivery.save();

  return ok(res, delivery, "Delivery validated — stock updated.");
});

exports.cancelDelivery = asyncHandler(async (req, res) => {
  const delivery = await DeliveryOrder.findById(req.params.id);
  if (!delivery) return fail(res, "Delivery order not found.", 404);
  if (delivery.status === "done") return fail(res, "Cannot cancel a validated delivery.", 400);

  delivery.status = "cancelled";
  await delivery.save();
  return ok(res, delivery, "Delivery order cancelled.");
});
