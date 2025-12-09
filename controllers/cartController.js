const Category = require("../models/category");
const Subcategory = require("../models/subcategory");
const Product = require("../models/product");
const AddToCart = require("../models/addtocart");
exports.addToCart = async (req, res) => {
    try {
        const {  productId } = req.body;
        const sessionId=req.userId
        // Find product details
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ error: 'Product not found' });

        // Check if cart item exists for this session and product
        let cartItem = await AddToCart.findOne({ sessionId, productId });
        if (cartItem) {
            cartItem.quantity += 1;
            await cartItem.save();
        } else {
            cartItem = await AddToCart.create({
                sessionId,
                productId,
                name: product.name,
                price: product.price,
                // prefer new mainImage when available
                image: `${process.env.BASE_URL}${product.mainImage || (product.images && product.images[0]) || product.image || ''}`,
                quantity: 1
            });
        }
        res.json({ success: true, cartItem });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add to cart' });
        console.log("hello how are you")
    }
};
exports.getCartItems =async(req,res)=>{
    try{
          const sessionId=req.userId
          console.log("userId",sessionId)
          console.log("hello")
  
       const cartItems = await AddToCart.find({ sessionId })
       
        res.json({cartItems});
        
    }catch(error){
        res.status(500).json({error:'Failed to fetch cart items'});
    }
}
exports.removeFromCart = async (req, res) => {
    try {
        const {  productId } = req.body;
     const sessionId=req.userId

        // Find cart item
        let cartItem = await AddToCart.findOne({ sessionId, productId });
        if (!cartItem) return res.status(404).json({ error: "Item not found in cart" });

        if (cartItem.quantity > 1) {
            // decrease quantity
            cartItem.quantity -= 1;
            await cartItem.save();
            res.json({ success: true, message: "Quantity decreased", cartItem });
        } else {
            // remove item
            await AddToCart.deleteOne({ _id: cartItem._id });
            res.json({ success: true, message: "Item removed from cart" });
        }
    } catch (error) {
        res.status(500).json({ error: "Failed to update cart" });
    }
};
