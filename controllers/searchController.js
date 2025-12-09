

const Product = require("../models/product");

exports.searchProduct = async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.json([]);

    let products = await Product.find({
      name: { $regex: q, $options: "i" }
    })
    .populate({
      path: "subcategory",
      select: "name category",
      populate: { path: "category", select: "name" }
    })
    .limit(10);

    // Return productId instead of _id and clean object
    const formatted = products.map((p) => ({
      id: p._id,  // send productId
      name: p.name,
      price: p.price,
      image: `${process.env.BASE_URL}${p.mainImage}`,
      images: p.images.map(img => img.startsWith('http') ? img : `${process.env.BASE_URL}${img}`),
      subcategory: p.subcategory,
      discription: p.description,
    }));

    res.json(formatted);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Search failed" });
  }
};
