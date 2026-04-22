const express = require("express");
const router = express.Router();
const Authentication = require("../middelwares/Authentication.middleware");
const WareHouseController = require("../Controllers/warehouse.controller");
router
  .route("/")
  .post(
    Authentication.Authentication,
    Authentication.isStaff,
    WareHouseController.createBill,
  )
  .get(
    Authentication.Authentication,
    Authentication.isStaff,
    WareHouseController.getAllBill,
  );

module.exports = router;
