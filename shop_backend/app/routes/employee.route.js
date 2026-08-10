const express = require("express");
const router = express.Router();
const EmployeeController = require("../Controllers/employee.controller");
const Authentication = require("../middelwares/Authentication.middleware");
const Upload = require("../middelwares/multer.middelware");
router
  .route("/")
  .get(
    Authentication.Authentication,
    Authentication.isStaff,
    EmployeeController.getListEmployee,
  )
  .post(
    Authentication.Authentication,
    Authentication.authorize("EMPLOYEE_CREATE"),
    EmployeeController.createEmployee,
  );

router
  .route("/log_out")
  .get(Authentication.Authentication, EmployeeController.logOut);

router
  .route("/updateStatusAccount/:id")
  .patch(
    Authentication.Authentication,
    Authentication.authorize("EMPLOYEE_UPDATE_STATUS"),
    EmployeeController.updateStatusAccount,
  );
router.route("/login").post(EmployeeController.loginEmployee);
router.route("/refresh-token").post(EmployeeController.refreshToken);

router
  .route("/update")
  .post(
    Authentication.Authentication,
    Authentication.isStaff,
    Upload.createUpload("avatars").single("avatar"),
    EmployeeController.updateEmployee,
  );
router
  .route("/change-password")
  .post(
    Authentication.Authentication,
    Authentication.isStaff,
    EmployeeController.changePassword,
  );

router
  .route("/infor")
  .get(
    Authentication.Authentication,
    Authentication.isStaff,
    EmployeeController.getInforEmployee,
  );

router
  .route("/grantPermissions/:id")
  .patch(
    Authentication.Authentication,
    Authentication.authorize("EMPLOYEE_GRANT"),
    EmployeeController.grantPermissions,
  );

router
  .route("/permission_list")
  .get(
    Authentication.Authentication,
    Authentication.isStaff,
    EmployeeController.getPermissionsList,
  );
module.exports = router;
