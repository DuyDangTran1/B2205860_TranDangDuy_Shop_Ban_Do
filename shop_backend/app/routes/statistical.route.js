const express = require("express");
const router = express.Router();
const StatisticalController = require("../Controllers/statistical.controller");
const Authentication = require("../middelwares/Authentication.middleware");

router
  .route("/")
  .get(
    Authentication.Authentication,
    Authentication.isAdmin,
    StatisticalController.getDashboardStats,
  );

module.exports = router;
