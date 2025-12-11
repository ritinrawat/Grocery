// Get all products for a given subcategory ID

// Get all subcategories (and their products) for a given category

const Category = require("../models/category");
const Subcategory = require("../models/subcategory");
const Product = require("../models/product");
const AddToCart = require("../models/addtocart");
const Banner = require("../models/banner");
const User = require("../models/userModel");
const Order = require("../models/order");


exports.renderForm = async (req, res) => {
    const categories = await Category.find().lean();
    let users = await User.find().lean();
    let orders = await Order.find().populate('sessionId').lean();
    const banners = await Banner.find().lean();

    // Compute total delivered amount for dashboard (orders with adminStatus 'delivered')
    let deliveredTotalAmount = 0;
    try {
        const pipelineTotal = [
            { $match: { adminStatus: 'delivered' } },
            {
                $addFields: {
                    calculatedAmount: {
                        $cond: [
                            { $ifNull: ["$amount", false] },
                            "$amount",
                            {
                                $reduce: {
                                    input: { $ifNull: ["$products", []] },
                                    initialValue: 0,
                                    in: { $add: ["$$value", { $multiply: [ { $ifNull: ["$$this.price", 0] }, { $ifNull: ["$$this.quantity", 1] } ] } ] }
                                }
                            }
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$calculatedAmount" }
                }
            }
        ];

        const totRes = await Order.aggregate(pipelineTotal);
        deliveredTotalAmount = (totRes && totRes[0] && totRes[0].total) ? totRes[0].total : 0;
    } catch (err) {
        console.error('Error computing delivered total for dashboard:', err);
        deliveredTotalAmount = 0;
    }

    const data = await Promise.all(
        categories.map(async (category) => {
            const subcategories = await Subcategory.find({ category: category._id }).lean();
            const subcatWithProducts = await Promise.all(
                subcategories.map(async (sub) => {
                    const products = await Product.find({ subcategory: sub._id }).lean();
                    return { ...sub, products };
                })
            );
            return { ...category, subcategories: subcatWithProducts };
        })
    );

    // Ensure IDs are strings for safe JSON embedding in views
    users = users.map(u => ({ ...u, _id: u._id.toString() }));
    orders = orders.map(o => ({
        ...o,
        _id: o._id.toString(),
        sessionId: o.sessionId ? { ...o.sessionId, _id: o.sessionId._id ? o.sessionId._id.toString() : (o.sessionId._id || o.sessionId).toString ? (o.sessionId._id || o.sessionId).toString() : o.sessionId } : null
    }));

    // Count totals for quick dashboard stats
    const totalOrdersCount = Array.isArray(orders) ? orders.length : await Order.countDocuments();
    const totalUsersCount = Array.isArray(users) ? users.length : await User.countDocuments();

    res.render("index", { categories: data, users, orders, banners, deliveredTotalAmount, totalOrdersCount, totalUsersCount });
};

exports.submitData = async (req, res) => {
    try {
        let { categoryName, sortno, subcategoryName, productName, productPrice, subcategory: subcategoryId, description } = req.body;

        // === Cloudinary URLs instead of local paths ===
        const categoryImage = req.files && req.files.categoryImage ? req.files.categoryImage[0].path : '';
        const subcategoryImage = req.files && req.files.subcategoryImage ? req.files.subcategoryImage[0].path : '';
        const productMainImage = req.files && (req.files.productImage || req.files.mainImage) ? 
            (req.files.productImage ? req.files.productImage[0].path : req.files.mainImage[0].path) : '';
        const imagesFiles = req.files && req.files.images ? req.files.images.map(f => f.path) : 
            (req.files && req.files.thumbnails ? req.files.thumbnails.map(f => f.path) : 
            (req.files && req.files.thumbnailImage ? [req.files.thumbnailImage[0].path] : []));

        // Normalize text
        if (typeof categoryName === 'string') categoryName = categoryName.trim().toLowerCase();
        if (typeof sortno === 'string') sortno = sortno.trim().toLowerCase();
        if (typeof subcategoryName === 'string') subcategoryName = subcategoryName.trim().toLowerCase();
        if (typeof productName === 'string') productName = productName.trim();

        let category = null;
        let subcategory = null;

        if (subcategoryId) {
            subcategory = await Subcategory.findById(subcategoryId);
            if (!subcategory) subcategory = null;
            else category = await Category.findById(subcategory.category);
        }

        if (!category && categoryName) {
            let found = await Category.findOne({ name: categoryName });
            if (!found) {
                found = await Category.create({
                    name: categoryName,
                    image: categoryImage,
                    sortno: sortno === 'NO' ? 'NO' : (Number(sortno) || 0),
                });
            } else if (sortno) {
                found.sortno = sortno === 'NO' ? 'NO' : (Number(sortno) || found.sortno);
                await found.save();
            }
            category = found;
        }

        if (!subcategory && subcategoryName) {
            subcategory = category ? 
                await Subcategory.findOne({ name: subcategoryName, category: category._id }) : 
                await Subcategory.findOne({ name: subcategoryName });

            if (!subcategory && category) {
                subcategory = await Subcategory.create({ name: subcategoryName, category: category._id, image: subcategoryImage });
            }
        }

        if (!productPrice && typeof req.body.price !== 'undefined') productPrice = req.body.price;

        if (productName) {
            if (!subcategory) {
                if (!category) return res.status(400).send('Missing category/subcategory for product');
                subcategory = await Subcategory.findOne({ name: 'general', category: category._id });
                if (!subcategory) subcategory = await Subcategory.create({ name: 'general', category: category._id, image: '' });
            }

            await Product.create({
                name: productName,
                price: productPrice || 0,
                description: description || '',
                mainImage: productMainImage,
                images: imagesFiles,
                subcategory: subcategory._id
            });
        }

        return res.redirect('/');
    } catch (err) {
        console.error('submitData error:', err);
        return res.status(500).send('Error submitting data');
    }
};

exports.getJsonData = async (req, res) => {
    try {
        const categories = await Category.find().lean();

        const data = await Promise.all(
            categories.map(async (category) => {
                const subcategories = await Subcategory.find({ category: category._id }).lean();

                const subcatWithProducts = await Promise.all(
                    subcategories.map(async (sub) => {
                        const products = await Product.find({ subcategory: sub._id }).lean();

                        const productsMapped = products.map(product => {
                            const imgs = Array.isArray(product.images) ? product.images : [];

                            // Main Image priority
                            const mainRaw =
                                product.mainImage ||
                                (imgs.length ? imgs[0] : product.image || "");

                            // No BASE_URL added
                            const main = mainRaw || "";

                            // Image Array (no BASE_URL)
                            const imagesFull = imgs.filter(Boolean);

                            return {
                                id: product._id,
                                productName: product.name,
                                productPrice: product.price,
                                productImage: main,
                                images: imagesFull
                            };
                        });

                        return {
                            id: sub._id,
                            subcategoryName: sub.name,
                            subcategoryImage: sub.image || "",
                            products: productsMapped
                        };
                    })
                );

                return {
                    id: category._id,
                    categoryName: category.name,
                    categoryImage: category.image || "",
                    sortno: category.sortno,
                    subcategories: subcatWithProducts
                };
            })
        );

        res.json({ data });
    } catch (error) {
        console.error("Error fetching JSON data:", error);
        res.status(500).json({ error: "Something went wrong" });
    }
};

exports.getSubcategories = async (req, res) => {
  try {
    const categoryId = req.params.id;
    console.log("Category ID:", categoryId);

    // Find category
    const category = await Category.findById(categoryId).lean();
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Find all subcategories
    const subcategories = await Subcategory.find({ category: categoryId }).lean();

    const subcatWithProducts = await Promise.all(
      subcategories.map(async (sub) => {
        const products = await Product.find({ subcategory: sub._id }).lean();

        const productsMapped = products.map((product) => {
          const imgs = Array.isArray(product.images) ? product.images : [];

          // MAIN IMAGE
          const mainRaw =
            product.mainImage ||
            (imgs.length ? imgs[0] : product.image || "");

          // If image starts with "http" → Cloudinary → return direct
          // Else → local image → add BASE_URL
          const main = mainRaw
            ? mainRaw.startsWith("http")
              ? mainRaw
              : `${process.env.BASE_URL}${mainRaw}`
            : "";

          // Process images array
          const imagesFull = imgs
            .map((i) =>
              i
                ? i.startsWith("http")
                  ? i
                  : `${process.env.BASE_URL}${i}`
                : ""
            )
            .filter(Boolean);

          return {
            id: product._id,
            productName: product.name,
            productPrice: product.price,
            productImage: main,
            images: imagesFull,
          };
        });

        return {
          id: sub._id,
          name: sub.name,
          // Subcategory image
          image: sub.image.startsWith("http")
            ? sub.image
            : `${process.env.BASE_URL}${sub.image}`,
          products: productsMapped,
        };
      })
    );

    // Send response
    res.json({
      categoryName: category.name,
      sortno: category.sortno,
      subcategories: subcatWithProducts,
    });
  } catch (error) {
    console.error("ERROR:", error);
    res.status(500).json({ error: "Failed to fetch subcategories" });
  }
};

exports.getProductsBySubcategory = async (req, res) => {
    try {
        const { id } = req.query;
        console.log("Subcategory ID:", id);

        // Find subcategory
        const subcategory = await Subcategory.findById(id);
        if (!subcategory) {
            return res.status(404).json({ error: "Subcategory not found" });
        }

        // Find products linked to subcategory
        const products = await Product.find({ subcategory: id }).lean();

        const formattedProducts = products.map(prod => {
            const imgs = Array.isArray(prod.images) ? prod.images : [];

            // Main image logic (Cloudinary-safe)
            const mainRaw =
                prod.mainImage ||
                (imgs.length ? imgs[0] : prod.image || '');

            const main = mainRaw
                ? (mainRaw.startsWith('http') ? mainRaw : `${process.env.BASE_URL}${mainRaw}`)
                : '';

            // All images array (Cloudinary-safe)
            const imagesFull =
                imgs
                    .map(i =>
                        i ? (i.startsWith('http') ? i : `${process.env.BASE_URL}${i}`) : ''
                    )
                    .filter(Boolean);

            return {
                id: prod._id,
                name: prod.name,
                price: prod.price,
                image: main, // single image support
                description: prod.description || '',
                images: imagesFull
            };
        });

        res.json({
            subcategory: {
                id: subcategory._id,
                name: subcategory.name,
                image: subcategory.image
                    ? (subcategory.image.startsWith('http')
                        ? subcategory.image
                        : `${process.env.BASE_URL}${subcategory.image}`)
                    : ''
            },
            products: formattedProducts
        });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Failed to fetch products for subcategory" });
    }
};

    // Update Category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, sortno } = req.body;

    // Prepare update data
    const updateData = {};
    if (name) updateData.name = name;
    if (sortno) updateData.sortno = sortno === "NO" ? "NO" : Number(sortno);

    // If a new image is uploaded via Cloudinary
    if (req.files && req.files.image && req.files.image[0]) {
      updateData.image = req.files.image[0].path; // Cloudinary URL
    }

    const updated = await Category.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) return res.status(404).json({ error: "Category not found" });

    // Redirect for browser form
    const accept = req.headers.accept || '';
    if (accept.includes('text/html')) {
      return res.redirect('/');
    }

    // JSON response for API
    res.json(updated);
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ error: "Update failed" });
  }
};

    // Delete Category
    exports.deleteCategory = async (req, res) => {
        try {
            const { id } = req.params;
            const deleted = await Category.findByIdAndDelete(id);
            if (!deleted) return res.status(404).json({ error: "Category not found" });
            res.json({ message: "Category deleted" });
        } catch (error) {
            res.status(500).json({ error: "Delete failed" });
        }
    };

    // Update Subcategory
    exports.updateSubcategory = async (req, res) => {
        try {
            const { id } = req.params;
            const { name } = req.body;
            const updatedata={}
               if (req.files && req.files.image && req.files.image[0]) {
      updatedata.image = req.files.image[0].path
    }
            if(name) updatedata.name=name
            const updated = await Subcategory.findByIdAndUpdate(id,updatedata, { new: true });
            if (!updated) return res.status(404).json({ error: "Subcategory not found" });
            res.json(updated);
        } catch (error) {
            res.status(500).json({ error: "Update failed" });
        }
    };

    // Delete Subcategory
    exports.deleteSubcategory = async (req, res) => {
        try {
            const { id } = req.params;
            const deleted = await Subcategory.findByIdAndDelete(id);
            if (!deleted) return res.status(404).json({ error: "Subcategory not found" });
            res.json({ message: "Subcategory deleted" });
        } catch (error) {
            res.status(500).json({ error: "Delete failed" });
        }
    };


   
   
exports.updateProduct = async (req, res) => {
        try {
            const { id } = req.params;
                        const { name, price, description } = req.body;
                        const updatedata = {};
                        if (typeof name !== 'undefined') updatedata.name = name;
                        if (typeof price !== 'undefined') updatedata.price = price;
                        if (typeof description !== 'undefined') updatedata.description = description;

                        // Files: support new names (mainImage, thumbnailImage, images[]) and legacy 'image'
                        if (req.files) {
                            if (req.files.mainImage && req.files.mainImage[0]) {
                                
                                updatedata.mainImage = req.files.mainImage[0].filename;
                            }
                            // support uploaded arrays in 'images' or legacy 'thumbnails' or single 'thumbnailImage'
                            if (req.files.images && Array.isArray(req.files.images) && req.files.images.length) {
                                updatedata.images = req.files.images.map(f => f.filename);
                                // set legacy thumbnail to first image for compatibility
                                updatedata.thumbnail = updatedata.images[0];
                            } else if (req.files.thumbnails && Array.isArray(req.files.thumbnails) && req.files.thumbnails.length) {
                                updatedata.images = req.files.thumbnails.map(f => f.filename);
                                updatedata.thumbnail = updatedata.images[0];
                            } else if (req.files.thumbnailImage && req.files.thumbnailImage[0]) {
                                updatedata.images = [req.files.thumbnailImage[0].filename];
                                updatedata.thumbnail = updatedata.images[0];
                            }
                            // backward compatibility
                            if (!updatedata.mainImage && req.files.image && req.files.image[0]) {
                                updatedata.mainImage = req.files.image[0].filename;
                                updatedata.image = updatedata.mainImage;
                            }
                        }

                        const updated = await Product.findByIdAndUpdate(id, updatedata, { new: true });
                        if (!updated) return res.status(404).json({ error: "Product not found" });

                        // If the request came from a browser form, redirect back to admin
                        const accept = req.headers.accept || '';
                        if (accept.includes('text/html')) {
                            return res.redirect('/');
                        }

                        res.json(updated);
        } catch (error) {
            res.status(500).json({ error: "Update failed" });
        }
    };

    // Delete Product
    exports.deleteProduct = async (req, res) => {
        try {
            const { id } = req.params;
            const deleted = await Product.findByIdAndDelete(id);
            if (!deleted) return res.status(404).json({ error: "Product not found" });
            res.json({ message: "Product deleted" });
        } catch (error) {
            res.status(500).json({ error: "Delete failed" });
        }
    };

        // Bulk add subcategory and products
        exports.addSubcategoryWithProducts = async (req, res) => {
    try {
        const { categoryId, subcategoryId, subcategoryName } = req.body;
        let products = req.body.products;
        // Parse products if sent as a string
        if (typeof products === 'string') {
            try {
                products = JSON.parse(products);
            } catch (err) {
                return res.status(400).json({ error: 'Invalid products format' });
            }
        }
        // Find category
        const category = await Category.findById(categoryId);
        const subcategories = await Subcategory.findById(subcategoryId);
        if (!category) return res.status(404).json({ error: "Category not found" });

        let subcategory;
        // If subcategoryId is provided and not empty, use existing subcategory
        if (subcategoryId) {
            subcategory = await Subcategory.findById(subcategoryId);
            if (!subcategory) return res.status(404).json({ error: "Subcategory not found" });
        } else {
            // Validate new subcategory fields
            if (!subcategoryName || !req.files.subcategoryImage) {
                return res.status(400).json({ error: "Subcategory name and image required for new subcategory" });
            }
            // Create new subcategory
            subcategory = await Subcategory.create({
                name: subcategoryName.trim().toLowerCase(),
                image: req.files.subcategoryImage[0].filename,
                category: category._id
            });
        }

        // Create products
        const createdProducts = [];
            for (let i = 0; i < products.length; i++) {
            const prod = products[i];
            if (!prod.name || !prod.price || !req.files.productImages[i]) continue;
            const mainImg =  req.files.productImages[i].filename;
            const product = await Product.create({
                name: prod.name.trim().toLowerCase(),
                price: prod.price,
                description: prod.description || '',
                mainImage: mainImg,
                images: [],
                subcategory: subcategory._id
            });
            createdProducts.push(product);
        }

        res.json({
            subcategory,
            products: createdProducts
        });
    } catch (error) {
        console.error("Error while adding subcategory/products:", error);
        res.status(500).json({ error: "Bulk add failed" });
    }
};

// Banner management
exports.renderBannerForm = async (req, res) => {
  try {
    const banner = await Banner.findOne().lean();
    const categories = await Category.find().lean();
    let users = await User.find().lean();
    let orders = await Order.find().populate('sessionId').lean();
    const banners = await Banner.find().lean();

    const data = await Promise.all(
      categories.map(async (category) => {
        const subcategories = await Subcategory.find({ category: category._id }).lean();
        const subcatWithProducts = await Promise.all(
          subcategories.map(async (sub) => {
            const products = await Product.find({ subcategory: sub._id }).lean();
            return { ...sub, products };
          })
        );
        return { ...category, subcategories: subcatWithProducts };
      })
    );

    // Fix images for Cloudinary (no prefix needed)
    if (banner) {
      banner.mainBannerImage = banner.mainBannerImage || "";
      banner.cardBannerImage1 = banner.cardBannerImage1 || "";
      banner.cardBannerImage2 = banner.cardBannerImage2 || "";
      banner.cardBannerImage3 = banner.cardBannerImage3 || "";
    }

    // Normalize IDs
    users = users.map(u => ({ ...u, _id: u._id.toString() }));

    orders = orders.map(o => ({
      ...o,
      _id: o._id.toString(),
      sessionId: o.sessionId
        ? { ...o.sessionId, _id: o.sessionId._id.toString() }
        : null
    }));

    res.render("index", { banner, categories: data, users, orders, banners });
  } catch (error) {
    console.error("Error loading banner:", error);
    res.status(500).send("Error loading banner");
  }
};


exports.uploadBanner = async (req, res) => {
    try {
        const { title, description, isActive } = req.body;

        // Get existing banner (should be only one)
        let banner = await Banner.findOne();

        // If no banner exists, create empty one first
        if (!banner) {
            banner = new Banner({});
        }

        // Update images only if new image uploaded
        if (req.files.mainBannerImage) {
            banner.mainBannerImage =   req.files.mainBannerImage[0].filename;
        }

        if (req.files.cardBannerImage1) {
            banner.cardBannerImage1 =   req.files.cardBannerImage1[0].filename;
        }

        if (req.files.cardBannerImage2) {
            banner.cardBannerImage2 =   req.files.cardBannerImage2[0].filename;
        }

        if (req.files.cardBannerImage3) {
            banner.cardBannerImage3 =   req.files.cardBannerImage3[0].filename;
        }

        // Update text fields
        banner.title = title || banner.title;
        banner.description = description || banner.description;
        banner.isActive = isActive === 'true';

        // Save updated banner
        await banner.save();

        // Handle redirect for EJS form
        const accept = req.headers.accept || '';
        if (accept.includes('text/html')) {
            return res.redirect('/');
        }

        res.json(banner);

    } catch (error) {
        console.error("Error uploading banner:", error);
        res.status(500).json({ error: "Failed to upload banner" });
    }
};

exports.renderEditCategory = async (req, res) => {
    try {
        const { id } = req.params;
        if (id) {
            // Render specific category edit page
            const category = await Category.findById(id).lean();
            if (!category) {
                return res.status(404).send("Category not found");
            }

            const subcategories = await Subcategory.find({ category: id }).lean();
            const subcatWithProducts = await Promise.all(
                subcategories.map(async (sub) => {
                    const products = await Product.find({ subcategory: sub._id }).lean();
                    return { ...sub, products };
                })
            );

            res.render("edit-category", { category: { ...category, subcategories: subcatWithProducts } });
        } else {
            // Render category selection page
            const categories = await Category.find().lean();
            res.render("edit-category", { categories });
        }
    } catch (error) {
        console.error("Error rendering edit category:", error);
        res.status(500).send("Error loading edit page");
    }
};

exports.renderProducts = async (req, res) => {
    try {
        const products = await Product.find().populate('subcategory').lean();
        const subcategories = await Subcategory.find().lean();
        res.render("products", { products, subcategories });
    } catch (error) {
        console.error("Error rendering products:", error);
        res.status(500).send("Error loading products page");
    }
};

exports.renderEditSubcategory = async (req, res) => {
    try {
        const { id } = req.params;
        const subcategory = await Subcategory.findById(id).lean();
        if (!subcategory) {
            return res.status(404).send("Subcategory not found");
        }
        res.render("edit-subcategory", { subcategory });
    } catch (error) {
        console.error("Error rendering edit subcategory:", error);
        res.status(500).send("Error loading edit subcategory page");
    }
};

exports.renderEditProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id).populate('subcategory').lean();
        if (!product) {
            return res.status(404).send("Product not found");
        }
        const subcategories = await Subcategory.find().lean();
        res.render("edit-product", { product, subcategories });
    } catch (error) {
        console.error("Error rendering edit product:", error);
        res.status(500).send("Error loading edit product page");
    }
};

exports.updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, isActive } = req.body;
    const banner = await Banner.findById(id);
    if (!banner) return res.status(404).send('Banner not found');

    if (typeof title !== 'undefined') banner.title = title;
    if (typeof description !== 'undefined') banner.description = description;
    if (typeof isActive !== 'undefined') banner.isActive = isActive === 'true';

    if (req.files && req.files.mainBannerImage) {
      banner.mainBannerImage =   req.files.mainBannerImage[0].filename;
    }
    if (req.files && req.files.cardBannerImage1) {
      banner.cardBannerImage1 =   req.files.cardBannerImage1[0].filename;
    }
    if (req.files && req.files.cardBannerImage2) {
      banner.cardBannerImage2 =   req.files.cardBannerImage2[0].filename;
    }
    if (req.files && req.files.cardBannerImage3) {
      banner.cardBannerImage3 =   req.files.cardBannerImage3[0].filename;
    }

    await banner.save();
    res.redirect('/');
  } catch (err) {
    console.error('Update banner error:', err);
    res.status(500).send('Error updating banner');
  }
};

exports.deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Banner.findByIdAndDelete(id);
    if (!deleted) return res.status(404).send('Banner not found');
    res.status(200).send('Banner deleted');
  } catch (err) {
    console.error('Delete banner error:', err);
    res.status(500).send('Error deleting banner');
  }
};
