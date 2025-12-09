const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../models/order");
const Cart = require("../models/addtocart");
const { v4: uuidv4 } = require("uuid");
let razorpay;
try {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key',// rzp_test_xxxxx
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret'// test secret
  });
} catch (error) {
  console.warn('Razorpay not configured, skipping initialization');
}


exports.createOrder = async (req, res) => {
  try {
    console.log("Creating Razorpay order...");
     const sessionId =req.userId
    console.log("USERID",sessionId)

    const{Address,paymentMethod}= req.body
const status= paymentMethod==="cod"?"placed":"created";
console.log("Payment Method:", paymentMethod);
    console.log("Address",Address)
    
    const cartItems = await Cart.find({ sessionId}).populate({ path: 'productId', populate: { path: 'subcategory', select: 'name' } });
    if (cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // 3️⃣ Build products array — store only one main image per product (legacy `image` kept for compatibility)
    const products = cartItems.map(item => {
      const prod = item.productId || {};
      const imgs = Array.isArray(prod.images) ? prod.images : [];
      const mainRaw = prod.mainImage || (imgs.length ? imgs[0] : prod.image || '');
      const main = mainRaw ? (mainRaw.startsWith('http') ? mainRaw : `${process.env.BASE_URL}${mainRaw}`) : '';

      return {
        productId: prod._id,
        name: prod.name,
        price: prod.price,
        quantity: item.quantity,
        // legacy single-image for compatibility with views
        image: main,
        // keep explicit mainImage field for clarity
        mainImage: main,
        // include subcategory info (if populated)
        subcategory: {
          subcategoryId: prod.subcategory && prod.subcategory._id ? prod.subcategory._id : (prod.subcategory || null),
          name: prod.subcategory && prod.subcategory.name ? prod.subcategory.name : ''
        }
      };
    });

    // 4️⃣ Calculate total amount
    const amount = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
    // 5️⃣ Create Razorpay order
    const options = {
      amount: amount * 100, // ₹ to paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    // 6️⃣ Save in DB
    const newOrder = new Order({
    sessionId,
    razorpayOrderId:order.id,
    amount,
    currency: order.currency,
    status,
    products,
    Address,
    paymentMethod
    });
 if (status === "placed" || status === "paid") {
  await Cart.deleteMany({ sessionId });
}
  await newOrder.save();
        // Clear user cart
    res.status(201).json({
      message: "Order created successfully",
      orderId: order.id,
      newOrder,
    });
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ message: "Order creation failed", error: err.message });
  }
};
exports.verifyPayment = async (req, res, next) => {
  try {
     const authHeader = req.headers.authorization;
        const sessionId =req.userId
    console.log("Authorization Header:", authHeader); 
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      // ✅ update payment info
      await Order.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        {
          status: "paid",
          paymentId: razorpay_payment_id,
          signature: razorpay_signature,
        }
      );

        await Cart.deleteMany({ sessionId });

      console.log("✅ Payment verified successfully");
      // pass data to placeOrder
      req.razorpay_order_id = razorpay_order_id;
      req.razorpay_payment_id = razorpay_payment_id;
      // ✅ call next so placeOrder runs
      next();
    } else {
      return res.status(400).json({ message: "Invalid signature" });
    }
  } catch (err) {
    console.error("Verify payment error:", err);
    res.status(500).json({ message: "Verification failed" });
  }
};