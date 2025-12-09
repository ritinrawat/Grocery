const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const authedecode=require('../middleware/authdecode')

router.post('/add',authedecode,cartController.addToCart);

router.get('/get',authedecode, cartController.getCartItems);

router.post('/remove',authedecode,cartController.removeFromCart)// Route to get cart items by session ID

module.exports = router;