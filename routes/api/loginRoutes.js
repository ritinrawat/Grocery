const express = require("express");
const router = express.Router();
const userController=require("../../controllers/userController");
const paymentController=require("../../controllers/paymentController")
const { body } = require("express-validator");
const authLogout=require('../../middleware/authlogout')
const authDecode=require('../../middleware/authdecode')
// const jwt = require("jsonwebtoken");
// const Order = require("../../models/order");
// const Razorpay = require("razorpay");
const orderController = require("../../controllers/orderController");

const crypto = require("crypto");
router.post(
  "/register",
  [
    body('email').isEmail().withMessage('Invalid Email'),
    body('password').isLength({min:6}).withMessage("Password too short"),
body("name")
  .isLength({ min: 2, max: 50 })
  .withMessage("Name must be between 2 and 50 characters")
  .matches(/^[A-Za-z\s]+$/)
  .withMessage("Name must contain only letters and spaces"),
    body('number').isLength({min:10}).withMessage("Invalid Number")
  
  ],
  userController.registerUser
);
router.post("/login",[
 body('email').isEmail().withMessage('Invalid Email'),
  body('password').isLength({min:6}).withMessage("Password too short"),
],userController.loginUser)

router.get("/logout",authLogout,userController.logoutUser)

// router.post('/refresh', (req, res) => {
//   const { refreshToken } = req.cookies;
//   if (!refreshToken) return res.status(401).json({ message: 'No refresh token' });

//   jwt.verify(refreshToken, process.env.REFRESH_SECRET, (err, user) => {
//     if (err) return res.status(403).json({ message: 'Invalid refresh token' });

//     const newToken = createAccessToken({ _id: user._id });
//     res.json({ token: newToken });
//   });
// });



// ✅ Create a new Razorpay order and save to DB
router.post("/create-order",authDecode,paymentController.createOrder);


// ✅ Verify payment signature and update DB
router.post("/verify-payment",paymentController.verifyPayment,);
module.exports = router;