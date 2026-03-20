const express = require("express");
const router = express.Router();
const EmployeeController = require("../Controllers/employee.controller");
const Authentication = require("../middelwares/Authentication.middleware");

router
  .route("/")
  .get(
    Authentication.Authentication,
    Authentication.isStaff,
    EmployeeController.getListEmployee,
  )
  .post(EmployeeController.createEmployee);
router.route("/update").post(EmployeeController.updateEmployee);
router
  .route("/updateStatusAccount/:id")
  .patch(EmployeeController.updateStatusAccount);
router.route("/login").post(EmployeeController.loginEmployee);
module.exports = router;
