const express = require("express");
const router = express.Router();
const authDecode=require('../../middleware/authdecode')
const paymentController=require("../../controllers/paymentController")
const orderController = require("../../controllers/orderController");
router.post("/create-order",authDecode,paymentController.createOrder);
// ✅ Verify payment signature and update DB
router.post("/verify-payment",authDecode,paymentController.verifyPayment,);
router.get("/gethistory",authDecode,orderController.getOrderHistory);
router.get("/getAddress",authDecode,orderController.getAddress);
module.exports = router;