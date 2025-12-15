// models/Product.js
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, default: 0 },
  description: { type: String, default: '' },
  // main image used across the site
    mainImage: result.secure_url,   // ✅ FULL URL
  images: [result.secure_url],    // ✅ FULL URL
  // optional additional/gallery images (removed - use thumbnails/gallery if needed)
  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subcategory"
  }
}, { timestamps: true });


module.exports = mongoose.models.Product || mongoose.model("Product", productSchema);
