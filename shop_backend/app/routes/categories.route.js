const express = require("express");
const categories = require("../Controllers/category.controller");
const Authentication = require("../middelwares/Authentication.middleware");
const router = express.Router();

router
  .route("/")
  .post(
    Authentication.Authentication,
    Authentication.authorize("CATEGORY_CREATE"),
    categories.create,
  )
  .get(categories.getAllCategories);

router.route("/tree/:slug").get(categories.getCategoriesTree);
router
  .route("/:id")
  .put(
    Authentication.Authentication,
    Authentication.authorize("CATEGORY_UPDATE"),
    categories.update,
  )
  .delete(
    Authentication.Authentication,
    Authentication.authorize("CATEGORY_DELETE"),
    categories.delete,
  );
module.exports = router;
