const express = require("express");
const router = express.Router();
const collection = require("../Controllers/collection.controller");
const Upload = require("../middelwares/multer.middelware");
router
  .route("/")
  .post(Upload.createUpload("collections").single("image"), collection.create)
  .get(collection.getAll);

router.route("/featured").get(collection.getFeatured);

router
  .route("/:id")
  .put(Upload.createUpload("collections").single("image"), collection.update)
  .delete(collection.delete)
  .get(collection.getCollection);

module.exports = router;
