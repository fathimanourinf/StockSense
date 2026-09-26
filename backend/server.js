require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const warehouseRoutes = require("./routes/warehouseRoutes");
const receiptRoutes = require("./routes/receiptRoutes");
const deliveryRoutes = require("./routes/deliveryRoutes");
const transferRoutes = require("./routes/transferRoutes");
const adjustmentRoutes = require("./routes/adjustmentRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (req, res) => res.json({ status: "ok", service: "StockSense API" }));

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/warehouses", warehouseRoutes);
app.use("/api/receipts", receiptRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/transfers", transferRoutes);
app.use("/api/adjustments", adjustmentRoutes);
app.use("/api/dashboard", dashboardRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ success: false, message: "Route not found." }));

// Central error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`StockSense API running on port ${PORT}`));
