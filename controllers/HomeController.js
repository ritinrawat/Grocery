
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

exports.updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).send("Banner not found");

    if (req.files?.mainBannerImage)
      banner.mainBannerImage = req.files.mainBannerImage[0].path;

    if (req.files?.cardBannerImage1)
      banner.cardBannerImage1 = req.files.cardBannerImage1[0].path;

    if (req.files?.cardBannerImage2)
      banner.cardBannerImage2 = req.files.cardBannerImage2[0].path;

    if (req.files?.cardBannerImage3)
      banner.cardBannerImage3 = req.files.cardBannerImage3[0].path;

    await banner.save();
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("Banner update failed");
  }
};



// exports.sortProducts=async(req,res)=>{
//   try{

//   }
// }
