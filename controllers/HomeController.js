
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

const CLOUDINARY_BASE =
  `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/`;

exports.getBanner = async (req, res) => {
  try {
    const banner = await Banner.findOne({ isActive: true }).lean();
    if (!banner) return res.json(null);

    res.json({
      ...banner,
      mainBannerImage: banner.mainBannerImage
        ? CLOUDINARY_BASE + banner.mainBannerImage
        : "",
      cardBannerImage1: banner.cardBannerImage1
        ? CLOUDINARY_BASE + banner.cardBannerImage1
        : "",
      cardBannerImage2: banner.cardBannerImage2
        ? CLOUDINARY_BASE + banner.cardBannerImage2
        : "",
      cardBannerImage3: banner.cardBannerImage3
        ? CLOUDINARY_BASE + banner.cardBannerImage3
        : "",
    });

  } catch (err) {
    res.status(500).json({ message: "Error fetching banner" });
  }
};



// exports.sortProducts=async(req,res)=>{
//   try{

//   }
// }
