const express = require("express");
const router = express.Router();
const collection_product = require("../Controllers/collection_product.controller");

router.route("/").post(collection_product.create);

router.route("/:collection_id/:product_id").delete(collection_product.delete);

router.route("/:collection_id").get(collection_product.getAllProductCollection);
router
  .route("/admin/:collection_id")
  .get(collection_product.getAllProductCollectionAdmin);
module.exports = router;
