const express = require("express");
const categories = require("../Controllers/category.controller");
const router = express.Router();

router.route("/").post(categories.create).get(categories.getAllCategories);

router.route("/:id").put(categories.update).delete(categories.delete);

module.exports = router;
