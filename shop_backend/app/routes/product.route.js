const express = require("express");
const products = require("../Controllers/products.controller");
const router = express.Router();

router.route("/").post(products.create);
router.route("/:category").get(products.findAllByCategory);
router
  .route("/:id")
  .get(products.findOneById)
  .put(products.update)
  .delete(products.delete);

module.exports = router;
