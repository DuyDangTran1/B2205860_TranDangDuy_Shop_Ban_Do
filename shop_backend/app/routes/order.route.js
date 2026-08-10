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
    Authentication.authorize("ORDER_VIEW"),
    OrderController.getAllOrders,
  );

router
  .route("/user")
  .get(Authentication.Authentication, OrderController.getAllOrdersByUser);

router
  .route("/updateStatus/:id")
  .patch(
    Authentication.Authentication,
    Authentication.authorize("ORDER_UPDATE_STATUS"),
    OrderController.updateStatus,
  );

router
  .route("/updateStatusCOD/:id")
  .patch(
    Authentication.Authentication,
    Authentication.authorize("ORDER_UPDATE_STATUS"),
    OrderController.updateStatusCOD,
  );

router
  .route("/cancel/:id")
  .patch(Authentication.Authentication, OrderController.cancelOrder);

router
  .route("/confirm_refund/:id")
  .patch(
    Authentication.Authentication,
    Authentication.authorize("ORDER_UPDATE_STATUS"),
    OrderController.confirmRefund,
  );

router
  .route("/requestExchange")
  .post(
    Authentication.Authentication,
    Authentication.authorize("ORDER_REQUEST_EXCHANGE"),
    OrderController.requestExchange,
  );

router
  .route("/confirmExchange/:id")
  .patch(
    Authentication.Authentication,
    Authentication.authorize("ORDER_CONFIRM_EXCHANGE"),
    OrderController.confirmExchange,
  );
module.exports = router;
