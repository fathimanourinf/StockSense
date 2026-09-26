const Category = require("../models/Category");
const { ok, fail } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");

exports.createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name) return fail(res, "Category name is required.", 422);
  const category = await Category.create({ name, description });
  return ok(res, category, "Category created.", 201);
});

exports.listCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  return ok(res, categories);
});

exports.updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!category) return fail(res, "Category not found.", 404);
  return ok(res, category, "Category updated.");
});

exports.deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return fail(res, "Category not found.", 404);
  return ok(res, null, "Category deleted.");
});
