const express = require("express");
const router = express.Router();
const Authentication = require("../middelwares/Authentication.middleware");
const SupplierController = require("../Controllers/supplier.controller");

router
  .route("/")
  .post(
    Authentication.Authentication,
    Authentication.authorize("SUPPLIER_CREATE"),
    SupplierController.create,
  )
  .get(
    Authentication.Authentication,
    Authentication.isStaff,
    SupplierController.getAllSupplier,
  );

router
  .route("/:id")
  .put(
    Authentication.Authentication,
    Authentication.authorize("SUPPLIER_UPDATE"),
    SupplierController.update,
  )
  .patch(
    Authentication.Authentication,
    Authentication.authorize("SUPPLIER_COLLABORATE"),
    SupplierController.updateCollaborateStatus,
  )
  .delete(
    Authentication.Authentication,
    Authentication.isAdmin,
    SupplierController.delete,
  );

module.exports = router;
