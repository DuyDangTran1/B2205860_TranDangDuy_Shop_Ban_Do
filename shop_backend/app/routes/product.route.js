const express = require("express");
const products = require("../Controllers/products.controller");
const router = express.Router();
const Upload = require("../middelwares/multer.middelware");
const Authentication = require("../middelwares/Authentication.middleware");
router
  .route("/")
  .post(
    Authentication.Authentication,
    Authentication.authorize("PRODUCT_CREATE"),
    Upload.createUpload("products").single("image"),
    products.create,
  )
  .get(products.getAllProduct);

router
  .route("/recommend")
  .get(Authentication.Authentication, products.getOutfitFromLastOrder);

router.route("/new").get(products.getProductNew);

router.route("/:category_name").get(products.findAllByCategory);

// router.route("/brandProduct/:slug").get(products.allSupplierByCategory);
router
  .route("/detail/:id")
  .get(products.getProductById)
  .put(
    Authentication.Authentication,
    Authentication.authorize("PRODUCT_UPDATE"),
    Upload.createUpload("products").single("image"),
    products.update,
  )
  .delete(
    Authentication.Authentication,
    Authentication.authorize("PRODUCT_DELETE"),
    products.delete,
  );

router
  .route("/set-discount/:id")
  .patch(
    Authentication.Authentication,
    Authentication.authorize("PRODUCT_SET_DISCOUNT"),
    products.setDiscount,
  );

module.exports = router;
