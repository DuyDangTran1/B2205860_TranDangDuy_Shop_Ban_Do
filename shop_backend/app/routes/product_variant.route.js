const express = require("express");
const products_variant = require("../Controllers/products_variant.controller");
const Upload = require("../middelwares/multer.middelware");
const router = express.Router();

router
  .route("/")
  .post(
    Upload.createUpload("products").single("image"),
    products_variant.create
  )
  .put(Upload.createUpload("products").single("image"), products_variant.update)
  .delete(products_variant.delete);

module.exports = router;
