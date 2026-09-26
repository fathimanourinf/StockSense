const mongoose = require("mongoose");
const STATUSES = require("./docStatusEnum");

const receiptLineSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    expectedQty: { type: Number, required: true, min: 0 },
    receivedQty: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const receiptSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    supplier: { type: String, required: true, trim: true },
    location: { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true },
    status: { type: String, enum: STATUSES, default: "draft" },
    lines: { type: [receiptLineSchema], validate: (v) => v.length > 0 },
    notes: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    validatedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Receipt", receiptSchema);
