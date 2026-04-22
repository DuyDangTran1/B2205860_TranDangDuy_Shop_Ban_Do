const express = require("express");
const ReviewController = require("../Controllers/review.controller");
const Authentication = require("../middelwares/Authentication.middleware");
const { createUpload } = require("../middelwares/multer.middelware");
const upload = createUpload("reviews");
const router = express.Router();

router.post(
  "/",
  Authentication.Authentication,
  upload.array("images", 10),
  ReviewController.createReview,
);
router.get("/product/:productId", ReviewController.getProductReviewsPublic);

router.get("/detail/:id", ReviewController.getReviewDetail);

router.get(
  "/admin/all",
  Authentication.Authentication,
  Authentication.isStaff,
  ReviewController.adminGetAllReviews,
);

router.patch(
  "/admin/status/:id",
  Authentication.Authentication,
  Authentication.isStaff,
  ReviewController.updateReviewVisibility,
);

module.exports = router;
