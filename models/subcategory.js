// models/Subcategory.js
const mongoose = require("mongoose");

const subcategorySchema = new mongoose.Schema({

  name: String,
  image: String,
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category"
  }
}, { timestamps: true });

module.exports = mongoose.model("Subcategory", subcategorySchema);
