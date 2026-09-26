const Product = require("../models/Product");
const StockItem = require("../models/StockItem");
const StockLedger = require("../models/StockLedger");
const Receipt = require("../models/Receipt");
const DeliveryOrder = require("../models/DeliveryOrder");
const InternalTransfer = require("../models/InternalTransfer");
const { ok } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");

const PENDING_STATUSES = ["draft", "waiting", "ready"];

exports.getKpis = asyncHandler(async (req, res) => {
  const [totalProductsInStock, pendingReceipts, pendingDeliveries, transfersScheduled] =
    await Promise.all([
      StockItem.aggregate([
        { $match: { quantity: { $gt: 0 } } },
        { $group: { _id: "$product" } },
        { $count: "count" },
      ]),
      Receipt.countDocuments({ status: { $in: PENDING_STATUSES } }),
      DeliveryOrder.countDocuments({ status: { $in: PENDING_STATUSES } }),
      InternalTransfer.countDocuments({ status: { $in: PENDING_STATUSES } }),
    ]);

  const stockTotals = await StockItem.aggregate([
    { $group: { _id: "$product", total: { $sum: "$quantity" } } },
  ]);
  const products = await Product.find({ isActive: true }, "reorderPoint");
  const reorderMap = new Map(products.map((p) => [String(p._id), p.reorderPoint || 0]));
  const totalsMap = new Map(stockTotals.map((s) => [String(s._id), s.total]));

  let lowStockCount = 0;
  let outOfStockCount = 0;
  for (const [productId, reorderPoint] of reorderMap.entries()) {
    const qty = totalsMap.get(productId) || 0;
    if (qty <= 0) outOfStockCount++;
    else if (qty <= reorderPoint) lowStockCount++;
  }

  return ok(res, {
    totalProductsInStock: totalProductsInStock[0]?.count || 0,
    lowStockCount,
    outOfStockCount,
    pendingReceipts,
    pendingDeliveries,
    transfersScheduled,
  });
});

exports.getMoveHistory = asyncHandler(async (req, res) => {
  const { product, location, movementType, page = 1, limit = 25 } = req.query;
  const filter = {};
  if (product) filter.product = product;
  if (location) filter.location = location;
  if (movementType) filter.movementType = movementType;

  const entries = await StockLedger.find(filter)
    .populate("product", "name sku")
    .populate("location", "name code")
    .populate("createdBy", "name")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await StockLedger.countDocuments(filter);
  return ok(res, { entries, total, page: Number(page), limit: Number(limit) });
});

exports.getLowStockAlerts = asyncHandler(async (req, res) => {
  const stockTotals = await StockItem.aggregate([
    { $group: { _id: "$product", total: { $sum: "$quantity" } } },
  ]);
  const totalsMap = new Map(stockTotals.map((s) => [String(s._id), s.total]));

  const products = await Product.find({ isActive: true }).populate("category", "name");
  const alerts = products
    .map((p) => ({
      product: p,
      currentStock: totalsMap.get(String(p._id)) || 0,
    }))
    .filter((a) => a.currentStock <= (a.product.reorderPoint || 0));

  return ok(res, alerts);
});
