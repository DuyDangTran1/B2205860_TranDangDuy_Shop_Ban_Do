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
    AuthenticationMiddleware.authorize("VOUCHER_CREATE"),
    voucher.create,
  );

router
  .route("/list_voucher")
  .get(
    AuthenticationMiddleware.Authentication,
    AuthenticationMiddleware.authorize("VOUCHER_VIEW"),
    voucher.getAllVouchersAdmin,
  );

router
  .route("/:id")
  .put(
    AuthenticationMiddleware.Authentication,
    AuthenticationMiddleware.authorize("VOUCHER_UPDATE"),
    voucher.update,
  )
  .patch(
    AuthenticationMiddleware.Authentication,
    AuthenticationMiddleware.authorize("VOUCHER_CHANGE_STATUS"),
    voucher.changeStatus,
  );

module.exports = router;
