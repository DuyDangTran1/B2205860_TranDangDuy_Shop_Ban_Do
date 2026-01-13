const express = require("express");
const router = express.Router();
const size = require("../Controllers/size.controller");

router.route("/").post(size.create).get(size.getAllSize);

router.route("/:id").put(size.update).delete(size.delete);

module.exports = router;
