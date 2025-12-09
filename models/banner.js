const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema({
  mainBannerImage: { type: String, required: true },
  cardBannerImage1: { type: String, default: "" },
  cardBannerImage2: { type: String, default: "" },
  cardBannerImage3: { type: String, default: "" },
  title: { type: String, default: "" },
  description: { type: String, default: "" },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("Banner", bannerSchema);
