const express = require("express");
const router = express.Router();
const DashboardController = require("../Controllers/dashboard.controller");
const Authentication = require("../middelwares/Authentication.middleware");

router.route("/").get(DashboardController.getOverview);

module.exports = router;
