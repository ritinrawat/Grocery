const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
sessionId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",   // 🔗 link to User collection
  required: true,
},
  razorpayOrderId: String,
  amount: Number,
  currency: String,
  status: String,
  adminStatus: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  products: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      name: String,
      price: Number,
      quantity: Number,
      image: String,
      // store subcategory info for display in order views
      subcategory: {
        subcategoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Subcategory" },
        name: String,
      },
    },
  ],
   paymentMethod: { type: String, required: true },
  Address: {
    houseAddress: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Order", orderSchema);
