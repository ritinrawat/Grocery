// models/Product.js
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, default: 0 },
  description: { type: String, default: '' },
  // main image used across the site
  mainImage: { type: String, default: '' },
  // smaller thumbnail used on product listing / product page
  // legacy single thumbnail (kept for backward compatibility)
  thumbnail: { type: String, default: '' },
  // additional images gallery (array) — store any number of images here
  images: [{ type: String }],
  // optional additional/gallery images (removed - use thumbnails/gallery if needed)
  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subcategory"
  }
}, { timestamps: true });


module.exports = mongoose.models.Product || mongoose.model("Product", productSchema);
