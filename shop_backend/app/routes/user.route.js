const express = require("express");
const router = express.Router();
const UserController = require("../Controllers/user.controller");
const Authentication = require("../middelwares/Authentication.middleware");
const Upload = require("../middelwares/multer.middelware");
router.route("/register").post(UserController.register);
router.route("/login").post(UserController.login);
router.route("/").get(UserController.getAllUser);
router
  .route("/updateInformationUser")
  .patch(
    Authentication.Authentication,
    Upload.createUpload("avatars").single("image"),
    UserController.updateInformationUser,
  );

router
  .route("/log_out")
  .get(Authentication.Authentication, UserController.logOut);

router.route("/me").get(Authentication.Authentication, UserController.Me);

router.route("/refresh-token").post(UserController.refreshToken);

router.route("/google-login").post(UserController.loginGoogle);

router
  .route("/:id")
  .patch(Authentication.Authentication, UserController.updateStatusAccount);

router.get(
  "/waiting-list",
  Authentication.Authentication,
  Authentication.isStaff,
  UserController.getWaitingList,
);
module.exports = router;
