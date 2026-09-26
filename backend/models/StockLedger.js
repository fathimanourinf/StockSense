const mongoose = require("mongoose");

const stockLedgerSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    location: { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true },
    changeQty: { type: Number, required: true }, // positive or negative
    resultingQty: { type: Number, required: true }, // quantity at this location after the change
    movementType: {
      type: String,
      enum: ["receipt", "delivery", "transfer_in", "transfer_out", "adjustment"],
      required: true,
    },
    sourceDocType: {
      type: String,
      enum: ["Receipt", "DeliveryOrder", "InternalTransfer", "StockAdjustment"],
      required: true,
    },
    sourceDocId: { type: mongoose.Schema.Types.ObjectId, required: true },
    sourceDocReference: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

stockLedgerSchema.index({ product: 1, createdAt: -1 });
stockLedgerSchema.index({ location: 1, createdAt: -1 });

module.exports = mongoose.model("StockLedger", stockLedgerSchema);
