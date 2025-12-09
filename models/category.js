// models/Category.js
const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: String,
  image: String,
  sortno: { type: mongoose.Schema.Types.Mixed, default: "NO" },
}, { timestamps: true });

module.exports = mongoose.model("Category", categorySchema);
