const StockItem = require("../models/StockItem");
const StockLedger = require("../models/StockLedger");

/**
 * Applies a single stock movement at one location and writes the audit trail.
 * This is the ONE place in the whole app that touches stock quantities —
 * every controller (receipts, deliveries, transfers, adjustments) calls this
 * instead of editing StockItem directly, so the ledger can never drift out
 * of sync with real stock.
 *
 * @param {Object} params
 * @param {ObjectId} params.product
 * @param {ObjectId} params.location
 * @param {Number} params.changeQty       positive to add stock, negative to remove
 * @param {String} params.movementType    "receipt" | "delivery" | "transfer_in" | "transfer_out" | "adjustment"
 * @param {String} params.sourceDocType   "Receipt" | "DeliveryOrder" | "InternalTransfer" | "StockAdjustment"
 * @param {ObjectId} params.sourceDocId
 * @param {String} params.sourceDocReference
 * @param {ObjectId} params.createdBy
 * @param {mongoose.ClientSession} [params.session]  optional, for multi-line transactions
 */
async function applyStockMovement({
  product,
  location,
  changeQty,
  movementType,
  sourceDocType,
  sourceDocId,
  sourceDocReference,
  createdBy,
  session = null,
}) {
  const opts = session ? { session } : {};

  let stockItem = await StockItem.findOne({ product, location }).session(session);
  if (!stockItem) {
    stockItem = new StockItem({ product, location, quantity: 0 });
  }

  const newQty = stockItem.quantity + changeQty;
  if (newQty < 0) {
    const err = new Error(
      `Insufficient stock: only ${stockItem.quantity} available at this location.`
    );
    err.statusCode = 409;
    throw err;
  }

  stockItem.quantity = newQty;
  await stockItem.save(opts);

  await StockLedger.create(
    [
      {
        product,
        location,
        changeQty,
        resultingQty: newQty,
        movementType,
        sourceDocType,
        sourceDocId,
        sourceDocReference,
        createdBy,
      },
    ],
    opts
  );

  return stockItem;
}

/** Convenience: total on-hand quantity of a product across ALL locations. */
async function getTotalStock(productId) {
  const result = await StockItem.aggregate([
    { $match: { product: productId } },
    { $group: { _id: "$product", total: { $sum: "$quantity" } } },
  ]);
  return result.length ? result[0].total : 0;
}

module.exports = { applyStockMovement, getTotalStock };
