const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", required: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

locationSchema.index({ warehouse: 1, code: 1 }, { unique: true });

module.exports = mongoose.model("Location", locationSchema);
