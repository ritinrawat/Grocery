
const Product = require("../models/product");
const Banner = require("../models/banner");

exports.getLatestProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .limit(7);

    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: "Error fetching latest products" });
  }
};




// exports.sortProducts=async(req,res)=>{
//   try{

//   }
// }
