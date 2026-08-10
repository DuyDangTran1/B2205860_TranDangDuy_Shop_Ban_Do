const express = require("express");
const router = express.Router();
const StatisticalController = require("../Controllers/statistical.controller");
const Authentication = require("../middelwares/Authentication.middleware");

router
  .route("/")
  .get(
    Authentication.Authentication,
    Authentication.authorize("STATISTICAL"),
    StatisticalController.getDashboardStats,
  );

router
  .route("/getInventoryStats")
  .get(
    Authentication.Authentication,
    Authentication.authorize("STATISTICAL"),
    StatisticalController.getInventoryStats,
  );

router
  .route("/getInventoryWarehouseStats")
  .get(
    Authentication.Authentication,
    Authentication.authorize("STATISTICAL"),
    StatisticalController.getInventoryWarehouseStats,
  );
module.exports = router;
