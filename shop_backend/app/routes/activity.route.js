const express = require("express");
const router = express.Router();
const activityController = require("../Controllers/activity.controller");
const Authentication = require("../middelwares/Authentication.middleware");

router
  .route("/")
  .get(
    Authentication.Authentication,
    Authentication.isStaff,
    activityController.findAll,
  );

module.exports = router;
