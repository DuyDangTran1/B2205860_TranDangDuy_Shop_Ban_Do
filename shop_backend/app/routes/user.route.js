const express = require("express");
const router = express.Router();
const UserController = require("../Controllers/user.controller");
const Authentication = require("../middelwares/Authentication.middleware");
router.route("/register").post(UserController.register);
router.route("/login").post(UserController.login);
router.route("/").get(UserController.getAllUser);
router.route("/loginWithGoogle").post(UserController.loginWithGoogle);
router
  .route("/updateInformationUser")
  .post(UserController.updateInformationUser);

router.route("/me").get(Authentication.Authentication, UserController.Me);

router.get(
  "/waiting-list",
  Authentication.Authentication,
  Authentication.isStaff,
  UserController.getWaitingList,
);
module.exports = router;
