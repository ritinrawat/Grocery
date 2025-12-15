
const Product = require("../models/product");
const Banner = require("../models/banner");

exports.getLatestProducts = async (req, res) => {
  try {
    console.log("Fetching latest products");

    const latestProducts = await Product.find()
      .sort({ createdAt: -1 })
      .limit(7);

    // Build full URLs for main image and images array, keep `image` for compatibility
    const updatedProducts = latestProducts.map((item) => {
      const obj = item.toObject();

      const rawMain = obj.mainImage || (obj.images && obj.images.length ? obj.images[0] : obj.image || '');
      const mainImageUrl =  rawMain.startsWith('http')
      
        
      const imagesArray = Array.isArray(obj.images) ? obj.images : [];
      const imagesFull = imagesArray.map((img) => (img && img.startsWith('http')));

      return {
        ...obj,
        mainImage: mainImageUrl,
        images: imagesFull,
        // keep `image` for older consumers (point to mainImage)
        image: mainImageUrl,
      };
    });

    res.status(200).json(updatedProducts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching latest products" });
  }
};

exports.getBanner = async (req, res) => {
  try {
    console.log("Fetching banner");

    const banner = await Banner.findOne({ isActive: true }).sort({ createdAt: -1 });

    console.log("Banner data:", banner);

    if (banner) {
      // Return Cloudinary URLs directly without modifying them
      const updatedBanner = {
        ...banner.toObject(),
        mainBannerImage: banner.mainBannerImage,
        cardBannerImage1: banner.cardBannerImage1,
        cardBannerImage2: banner.cardBannerImage2,
        cardBannerImage3: banner.cardBannerImage3
      };

      return res.status(200).json(updatedBanner);
    }

    return res.status(200).json(null);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error fetching banner" });
  }
};


// exports.sortProducts=async(req,res)=>{
//   try{

//   }
// }
