const express = require("express");
const router = express.Router();
const collection = require("../Controllers/collection.controller");

router.route("/").post(collection.create).get(collection.getAll);

router.route("/:id").put(collection.update).delete(collection.delete);
module.exports = router;
