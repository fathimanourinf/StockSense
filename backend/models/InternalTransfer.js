const mongoose = require("mongoose");
const STATUSES = require("./docStatusEnum");

const transferLineSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const internalTransferSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true }, // IT-000001
    fromLocation: { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true },
    toLocation: { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true },
    status: { type: String, enum: STATUSES, default: "draft" },
    lines: { type: [transferLineSchema], validate: (v) => v.length > 0 },
    notes: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    validatedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("InternalTransfer", internalTransferSchema);
