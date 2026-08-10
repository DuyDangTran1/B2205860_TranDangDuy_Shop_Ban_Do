const express = require("express");
const router = express.Router();
const Authentication = require("../middelwares/Authentication.middleware");
const WareHouseController = require("../Controllers/warehouse.controller");
router
  .route("/")
  .post(
    Authentication.Authentication,
    Authentication.authorize("WAREHOUSE_CREATE_BILL"),
    WareHouseController.createBill,
  )
  .get(
    Authentication.Authentication,
    Authentication.authorize("WAREHOUSE_VIEW"),
    WareHouseController.getAllBill,
  );

module.exports = router;
