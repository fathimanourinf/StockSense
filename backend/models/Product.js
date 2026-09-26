const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true, trim: true, uppercase: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    uom: { type: String, required: true, default: "unit" },
    description: { type: String, trim: true },

    reorderPoint: { type: Number, default: 0 },
    reorderQty: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.index({ name: "text", sku: "text" });

module.exports = mongoose.model("Product", productSchema);
