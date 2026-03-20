const express = require("express");
const router = express.Router();
const chatController = require("../Controllers/chat.controller");
const Authentication = require("../middelwares/Authentication.middleware");
const { Model } = require("firebase-admin/machine-learning");

router
  .route("/")
  .post(Authentication.Authentication, chatController.chat)
  .get(Authentication.Authentication, chatController.getHistoryUser);

router
  .route("/history/:user_id")
  .get(
    Authentication.Authentication,
    Authentication.isStaff,
    chatController.getHistoryStaff,
  );
module.exports = router;
