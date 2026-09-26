const mongoose = require("mongoose");
const STATUSES = require("./docStatusEnum");

const deliveryLineSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    orderedQty: { type: Number, required: true, min: 0 },
    deliveredQty: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const deliveryOrderSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    customer: { type: String, required: true, trim: true },
    location: { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true },
    status: { type: String, enum: STATUSES, default: "draft" },
    lines: { type: [deliveryLineSchema], validate: (v) => v.length > 0 },
    notes: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    validatedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DeliveryOrder", deliveryOrderSchema);
