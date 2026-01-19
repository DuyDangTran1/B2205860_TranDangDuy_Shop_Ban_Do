const express = require("express");
const cors = require("cors");
const ProductsRouter = require("./app/routes/product.route");
const ProductVariantRouter = require("./app/routes/product_variant.route");
const CategoriesRouter = require("./app/routes/categories.route");
const ColorRouter = require("./app/routes/color.route");
const SizeRouter = require("./app/routes/size.route");
const CollectionRouter = require("./app/routes/collection.route");
const ApiError = require("./app/api-error");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use("/api/products", ProductsRouter);
app.use("/api/product_variant", ProductVariantRouter);
app.use("/api/category", CategoriesRouter);
app.use("/api/color", ColorRouter);
app.use("/api/size", SizeRouter);
app.use("/api/collection", CollectionRouter);

app.use((req, res, next) => {
  return next(new ApiError(404, "Không tìm thấy tài nguyên"));
});

app.use((error, req, res, next) => {
  return res.status(error.statusCode || 500).json({
    message: error.message || "Lỗi server",
  });
});
module.exports = app;
