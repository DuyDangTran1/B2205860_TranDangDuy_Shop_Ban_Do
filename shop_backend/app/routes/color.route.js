const express = require("express");
const router = express.Router();
const color = require("../Controllers/color.controller");

router.route("/").get(color.getAllColor).post(color.create);
router.route("/:id").put(color.update).delete(color.delete);

module.exports = router;
