const express = require("express");
const router = express.Router();
const SupplierController = require("../Controllers/supplier.controller");

router.route("/").post(SupplierController.create);

router
  .route("/:id")
  .put(SupplierController.update)
  .delete(SupplierController.delete);

module.exports = router;
