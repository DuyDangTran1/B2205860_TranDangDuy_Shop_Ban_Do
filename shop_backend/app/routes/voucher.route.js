const express = require("express");
const router = express.Router();
const voucher = require("../Controllers/voucher.controller");
const AuthenticationMiddleware = require("../middelwares/Authentication.middleware");
router
  .route("/check")
  .get(AuthenticationMiddleware.Authentication, voucher.check);

router
  .route("/")
  .get(AuthenticationMiddleware.Authentication, voucher.getAll)
  .post(
    AuthenticationMiddleware.Authentication,
    AuthenticationMiddleware.isAdmin,
    voucher.create,
  );

router
  .route("/list_voucher")
  .get(
    AuthenticationMiddleware.Authentication,
    AuthenticationMiddleware.isAdmin,
    voucher.getAllVouchersAdmin,
  );

router
  .route("/:id")
  .put(
    AuthenticationMiddleware.Authentication,
    AuthenticationMiddleware.isAdmin,
    voucher.update,
  )
  .patch(
    AuthenticationMiddleware.Authentication,
    AuthenticationMiddleware.isAdmin,
    voucher.changeStatus,
  );

module.exports = router;
