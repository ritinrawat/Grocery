
const userModel=require('../models/userModel')
const {validationResult}=require("express-validator")
const bcrypt = require("bcryptjs");     // For hashing & comparing passwords
const jwt = require("jsonwebtoken");


exports.loginUser = async (req, res, next) => {
  try {
    console.log("hello its woking")
    // 1. Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    console.log(email,password)

    // 2. Find user and include password
    const user = await userModel.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 3. Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 4. Generate tokens
    const accessToken = user.generateAuthToken(); // expires in 24h
    //  const refreshToken = user.generateRefreshToken();
    // // 5. Set cookies (refresh as HttpOnly, access token optional)
    res.cookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Optional: also set access token cookie if you prefer cookie-based auth
    // res.cookie('accessToken', accessToken, { httpOnly: true, secure: true });

    // 6. Send response with access token and user data (without password)
    const safeUser = user.toObject();
    delete safeUser.password;

      res.status(200).json({ accessToken, user: { email: user.email, _id: user._id } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.registerUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name, number } = req.body;

    let user = await userModel.findOne({ email });

    if (!user) {
      // Password will be hashed automatically by pre-save hook
      user = await userModel.create({ name, number, email, password });
      console.log("User created", user);
    } else {
      return res.status(400).json({ message: "User already exists" });
    }

    // Generate token
  const accessToken = user.generateAuthToken();
    // const refreshToken = user.generateRefreshToken();

    // // Set cookie
    res.cookie( accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ accessToken, user: { email: user.email, _id: user._id } });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Logout function
module.exports.logoutUser = async (req, res) => {
  try { 
    const token =
      req.cookies?.token ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null);

    if (!token) {
      return res.status(400).json({ message: "No token provided" });
    }
    res.clearCookie("token");

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Logout failed" });
  }
};
