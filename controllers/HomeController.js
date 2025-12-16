
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

// exports.getBanner = async (req, res) => {
//   try {
//     console.log("Fetching banner");
//     const banner = await Banner.findOne({ isActive: true }).sort({ createdAt: -1 });
//     console.log("Banner data:", banner);
//     if (banner) {
//       // Return Cloudinary URLs directly without modifying them
//       const updatedBanner = {
//         ...banner.toObject(),
//         mainBannerImage: banner.mainBannerImage,
//         cardBannerImage1: banner.cardBannerImage1,
//         cardBannerImage2: banner.cardBannerImage2,
//         cardBannerImage3: banner.cardBannerImage3
//       };

//       return res.status(200).json(updatedBanner);
//     }

//     return res.status(200).json(null);

//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "Error fetching banner" });
//   }
// };


// exports.sortProducts=async(req,res)=>{
//   try{

//   }
// }
