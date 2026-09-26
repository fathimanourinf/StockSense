const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true, trim: true, uppercase: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    uom: { type: String, required: true, default: "unit" }, // unit of measure: kg, unit, box...
    description: { type: String, trim: true },

    // Reordering rules
    reorderPoint: { type: Number, default: 0 }, // trigger "low stock" below this
    reorderQty: { type: Number, default: 0 }, // suggested quantity to reorder

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productSchema.index({ name: "text", sku: "text" }); // enables SKU / name search

module.exports = mongoose.model("Product", productSchema);
