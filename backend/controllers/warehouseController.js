const Warehouse = require("../models/Warehouse");
const Location = require("../models/Location");
const { ok, fail } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");

exports.createWarehouse = asyncHandler(async (req, res) => {
  const { name, code, address } = req.body;
  if (!name || !code) return fail(res, "Warehouse name and code are required.", 422);
  const warehouse = await Warehouse.create({ name, code, address });
  return ok(res, warehouse, "Warehouse created.", 201);
});

exports.listWarehouses = asyncHandler(async (req, res) => {
  const warehouses = await Warehouse.find().sort({ name: 1 });
  return ok(res, warehouses);
});

exports.updateWarehouse = asyncHandler(async (req, res) => {
  const warehouse = await Warehouse.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!warehouse) return fail(res, "Warehouse not found.", 404);
  return ok(res, warehouse, "Warehouse updated.");
});


exports.createLocation = asyncHandler(async (req, res) => {
  const { warehouse, name, code } = req.body;
  if (!warehouse || !name || !code) {
    return fail(res, "warehouse, name and code are required.", 422);
  }
  const location = await Location.create({ warehouse, name, code });
  return ok(res, location, "Location created.", 201);
});

exports.listLocations = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.warehouse) filter.warehouse = req.query.warehouse;
  const locations = await Location.find(filter).populate("warehouse", "name code").sort({ name: 1 });
  return ok(res, locations);
});
