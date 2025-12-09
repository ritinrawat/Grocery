const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const addToCartSchema = new Schema({
  sessionId: { type: String, required: true },
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String },
  quantity: { type: Number, default: 1 }
});

// Add a compound index to ensure one cart item per session+product
addToCartSchema.index({ sessionId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model('AddToCart', addToCartSchema);