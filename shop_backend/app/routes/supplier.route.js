const express = require("express");
const router = express.Router();
const SupplierController = require("../Controllers/supplier.controller");

router
  .route("/")
  .post(SupplierController.create)
  .get(SupplierController.getAllSupplier);

router
  .route("/:id")
  .put(SupplierController.update)
  .patch(SupplierController.updateCollaborateStatus)
  .delete(SupplierController.delete);

module.exports = router;
