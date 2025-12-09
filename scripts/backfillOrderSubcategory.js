const connectDB = require('../config/db');
const mongoose = require('mongoose');
const Order = require('../models/order');
const Product = require('../models/product');

async function backfill() {
  await connectDB();
  try {
    const orders = await Order.find({}).lean();
    let updatedCount = 0;
    for (const o of orders) {
      const shouldUpdate = o.products && o.products.some(p => !p.subcategory || !p.subcategory.name);
      if (!shouldUpdate) continue;
      const orderDoc = await Order.findById(o._id);
      let changed = false;
      for (let i = 0; i < orderDoc.products.length; i++) {
        const p = orderDoc.products[i];
        if (!p.subcategory || !p.subcategory.name) {
          if (p.productId) {
            const prod = await Product.findById(p.productId).populate('subcategory', 'name').lean();
            if (prod && prod.subcategory) {
              p.subcategory = {
                subcategoryId: prod.subcategory._id,
                name: prod.subcategory.name,
              };
              changed = true;
            }
          }
        }
      }
      if (changed) {
        await orderDoc.save();
        updatedCount++;
        console.log('Updated order', orderDoc._id);
      }
    }
    console.log('Backfill complete. Orders updated:', updatedCount);
  } catch (err) {
    console.error('Backfill error:', err);
  } finally {
    mongoose.connection.close();
  }
}

backfill();
