const mongoose = require("mongoose");
const STATUSES = require("./docStatusEnum");

const adjustmentLineSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    systemQty: { type: Number, required: true },
    countedQty: { type: Number, required: true },
    diff: { type: Number, required: true },
  },
  { _id: false }
);

const stockAdjustmentSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    location: { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true },
    status: { type: String, enum: STATUSES, default: "draft" },
    lines: { type: [adjustmentLineSchema], validate: (v) => v.length > 0 },
    reason: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    validatedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StockAdjustment", stockAdjustmentSchema);
