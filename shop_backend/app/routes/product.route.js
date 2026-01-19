const express = require("express");
const products = require("../Controllers/products.controller");
const router = express.Router();
const Upload = require("../middelwares/multer.middelware");

router
  .route("/")
  .post(Upload.createUpload("products").single("image"), products.create);

router.route("/:category_name").get(products.findAllByCategory);

router
  .route("/detail/:id")
  .get(products.getProductById)
  .put(Upload.createUpload("products").single("image"), products.update)
  .delete(products.delete);

module.exports = router;
