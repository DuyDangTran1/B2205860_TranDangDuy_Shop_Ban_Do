const express = require("express");
const router = express.Router();
const collection_product = require("../Controllers/collection_product.controller");

router
  .route("/")
  .post(collection_product.create)
  .put(collection_product.update)
  .delete(collection_product.delete);

module.exports = router;
