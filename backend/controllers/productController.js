const Product = require("../models/Product");
const StockItem = require("../models/StockItem");
const Location = require("../models/Location");
const { ok, fail } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { applyStockMovement } = require("../utils/stockService");

exports.createProduct = asyncHandler(async (req, res) => {
  const { name, sku, category, uom, description, reorderPoint, reorderQty, initialStock } =
    req.body;

  if (!name || !sku) return fail(res, "Name and SKU are required.", 422);

  const product = await Product.create({
    name,
    sku,
    category,
    uom,
    description,
    reorderPoint,
    reorderQty,
  });

  if (initialStock && initialStock.locationId && initialStock.quantity > 0) {
    const location = await Location.findById(initialStock.locationId);
    if (!location) return fail(res, "Initial stock location not found.", 404);

    await applyStockMovement({
      product: product._id,
      location: location._id,
      changeQty: initialStock.quantity,
      movementType: "adjustment",
      sourceDocType: "StockAdjustment",
      sourceDocId: product._id,
      sourceDocReference: `INIT-${product.sku}`,
      createdBy: req.user._id,
    });
  }

  return ok(res, product, "Product created.", 201);
});

exports.listProducts = asyncHandler(async (req, res) => {
  const { search, category, page = 1, limit = 20 } = req.query;

  const query = { isActive: true };
  if (category) query.category = category;
  if (search) query.$text = { $search: search };

  const products = await Product.find(query)
    .populate("category", "name")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Product.countDocuments(query);

  return ok(res, { products, total, page: Number(page), limit: Number(limit) });
});

exports.getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate("category", "name");
  if (!product) return fail(res, "Product not found.", 404);
  return ok(res, product);
});

exports.updateProduct = asyncHandler(async (req, res) => {
  const updates = (({ name, category, uom, description, reorderPoint, reorderQty, isActive }) => ({
    name,
    category,
    uom,
    description,
    reorderPoint,
    reorderQty,
    isActive,
  }))(req.body);

  const product = await Product.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!product) return fail(res, "Product not found.", 404);
  return ok(res, product, "Product updated.");
});

exports.deactivateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!product) return fail(res, "Product not found.", 404);
  return ok(res, product, "Product deactivated.");
});

exports.getAvailability = asyncHandler(async (req, res) => {
  const items = await StockItem.find({ product: req.params.id })
    .populate({ path: "location", populate: { path: "warehouse", select: "name code" } })
    .sort({ quantity: -1 });

  const total = items.reduce((sum, i) => sum + i.quantity, 0);
  return ok(res, { total, byLocation: items });
});
