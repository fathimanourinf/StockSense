const StockItem = require("../models/StockItem");
const StockLedger = require("../models/StockLedger");

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

async function getTotalStock(productId) {
  const result = await StockItem.aggregate([
    { $match: { product: productId } },
    { $group: { _id: "$product", total: { $sum: "$quantity" } } },
  ]);
  return result.length ? result[0].total : 0;
}

module.exports = { applyStockMovement, getTotalStock };
