const express = require("express");
const router = express.Router();
const CartController = require("../Controllers/cart.controller");
const Authentication = require("../middelwares/Authentication.middleware");

router
  .route("/")
  .post(Authentication.Authentication, CartController.create)
  .put(Authentication.Authentication, CartController.update)
  .delete(Authentication.Authentication, CartController.deleteAll)
  .get(Authentication.Authentication, CartController.getCartByUser);
router
  .route("/delete")
  .delete(Authentication.Authentication, CartController.delete);

module.exports = router;
