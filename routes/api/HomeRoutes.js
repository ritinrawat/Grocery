const express = require("express");
const router = express.Router();
const homeController = require("../../controllers/HomeController");
router.get("/getTrending", homeController.getLatestProducts );
// router.get("/sortproducts", homeController.sortProducts );

module.exports = router;
