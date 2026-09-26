const mongoose = require("mongoose");

// The current on-hand quantity of one product at one location.
// This is the "live" table the dashboard and stock checks read from.
const stockItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    location: { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true },
    quantity: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

stockItemSchema.index({ product: 1, location: 1 }, { unique: true });

module.exports = mongoose.model("StockItem", stockItemSchema);
