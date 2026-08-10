const express = require("express");
const products_variant = require("../Controllers/products_variant.controller");
const Upload = require("../middelwares/multer.middelware");
const Authentication = require("../middelwares/Authentication.middleware");
const router = express.Router();

router
  .route("/")
  .post(
    Authentication.Authentication,
    Authentication.authorize("VARIANT_CREATE"),
    Upload.createUpload("products").single("image"),
    products_variant.create,
  );

router
  .route("/:id")
  .put(
    Authentication.Authentication,
    Authentication.authorize("VARIANT_UPDATE"),
    Upload.createUpload("products").single("image"),
    products_variant.update,
  )
  .delete(
    Authentication.Authentication,
    Authentication.authorize("VARIANT_DELETE"),
    products_variant.delete,
  );

router
  .route("/by-product/:product_id")
  .get(products_variant.getVariantsByProductId);

module.exports = router;
