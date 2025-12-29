
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const cookieParser=require('cookie-parser')



// const Category = require("../models/category");
require("dotenv").config();
const cors = require("cors");
const app = express();
app.use(cors({
  origin: "https://groceryfrontend-za4k.onrender.com",
  credentials: true
}));

// MongoDB Connection
require('./config/db')()
// Middlewares
app.use(bodyParser.urlencoded({ extended: false }));

const methodOverride = require('method-override');
app.use(methodOverride('_method'));
app.use(cookieParser());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));


// Routes
app.use(express.json());

const dataRoutes = require("./routes/admin/adminRoutes");
const data= require("./routes/cartRoutes")
const searchRoutes = require("./routes/searchRoutes");
const autheRoute=require("./routes/api/loginRoutes")
const paymentRoutes=require("./routes/api/paymentRoutes")
const homeRoutes=require("./routes/api/HomeRoutes")
app.use("/images", express.static("public/images"));
app.use("/cart",data);
app.use("/",dataRoutes);
app.use("/products",searchRoutes);
app.use("/auth",autheRoute)
app.use("/payment",paymentRoutes)
app.use("/homeproducts",homeRoutes)

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});