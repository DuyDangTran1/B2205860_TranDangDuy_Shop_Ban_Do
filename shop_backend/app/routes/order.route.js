const express = require("express");
const router = express.Router();
const OrderController = require("../Controllers/order.controller");
const Authentication = require("../middelwares/Authentication.middleware");

router
  .route("/pay")
  .post(Authentication.Authentication, OrderController.createOrder);

router
  .route("/vnpay_return")
  .get(Authentication.Authentication, OrderController.vnpayReturn);

router
  .route("/momo_return")
  .get(Authentication.Authentication, OrderController.momoReturn);

router
  .route("/receive_confirm/:id")
  .patch(Authentication.Authentication, OrderController.orderReceiveConfirm);

router
  .route("/")
  .get(
    Authentication.Authentication,
    Authentication.isStaff,
    OrderController.getAllOrders,
  );

router
  .route("/user")
  .get(Authentication.Authentication, OrderController.getAllOrdersByUser);

router
  .route("/updateStatus/:id")
  .patch(
    Authentication.Authentication,
    Authentication.isStaff,
    OrderController.updateStatus,
  );
module.exports = router;
