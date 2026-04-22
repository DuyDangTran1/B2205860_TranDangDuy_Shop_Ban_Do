const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const ProductsRouter = require("./app/routes/product.route");
const ProductVariantRouter = require("./app/routes/product_variant.route");
const CategoriesRouter = require("./app/routes/categories.route");
const ColorRouter = require("./app/routes/color.route");
const SizeRouter = require("./app/routes/size.route");
const CollectionRouter = require("./app/routes/collection.route");
const CollectionProductRoute = require("./app/routes/collection_product.route");
const UserRouter = require("./app/routes/user.route");
const SupplierController = require("./app/routes/supplier.route");
const CartRoute = require("./app/routes/cart.route");
const ChatRoute = require("./app/routes/chat.route");
const OrderRoute = require("./app/routes/order.route");
const EmployeeRoute = require("./app/routes/employee.route");
const WareHouseRoute = require("./app/routes/warehouse.route");
const VoucherRoute = require("./app/routes/voucher.route");
const ReviewRoute = require("./app/routes/review.route");
const StatisticalRoute = require("./app/routes/statistical.route");
const DashboardRoute = require("./app/routes/dashboard.route");
const ActivityRoute = require("./app/routes/activity.route");
const ApiError = require("./app/api-error");

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3001", "http://localhost:3002"],
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.json());
app.use(express.static("public"));
app.use("/api/products", ProductsRouter);
app.use("/api/product_variant", ProductVariantRouter);
app.use("/api/categories", CategoriesRouter);
app.use("/api/color", ColorRouter);
app.use("/api/size", SizeRouter);
app.use("/api/collection", CollectionRouter);
app.use("/api/collection_product", CollectionProductRoute);
app.use("/api/user", UserRouter);
app.use("/api/supplier", SupplierController);
app.use("/api/cart", CartRoute);
app.use("/api/chat", ChatRoute);
app.use("/api/order", OrderRoute);
app.use("/api/employee", EmployeeRoute);
app.use("/api/warehouse", WareHouseRoute);
app.use("/api/voucher", VoucherRoute);
app.use("/api/review", ReviewRoute);
app.use("/api/statistical", StatisticalRoute);
app.use("/api/dashboard", DashboardRoute);
app.use("/api/activity", ActivityRoute);
app.use((req, res, next) => {
  return next(new ApiError(404, "Không tìm thấy tài nguyên"));
});

app.use((error, req, res, next) => {
  return res.status(error.statusCode || 500).json({
    message: error.message || "Lỗi server",
  });
});
module.exports = app;
