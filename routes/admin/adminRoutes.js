const express = require("express");
const router = express.Router();
const adminController = require("../../controllers/dataController");
const orderController = require("../../controllers/orderController");
const upload = require("../../multer/multer");

// Banner routes
router.get('/banner', adminController.renderBannerForm);
router.post('/banner', upload.fields([
  { name: 'mainBannerImage', maxCount: 1 },
  { name: 'cardBannerImage1', maxCount: 1 },
  { name: 'cardBannerImage2', maxCount: 1 },
  { name: 'cardBannerImage3', maxCount: 1 }
]), adminController.uploadBanner);

// Banner update and delete
router.put('/banner/:id', upload.fields([
  { name: 'mainBannerImage', maxCount: 1 },
  { name: 'cardBannerImage1', maxCount: 1 },
  { name: 'cardBannerImage2', maxCount: 1 },
  { name: 'cardBannerImage3', maxCount: 1 }
]), adminController.updateBanner);
router.post('/banner/:id', upload.fields([
  { name: 'mainBannerImage', maxCount: 1 },
  { name: 'cardBannerImage1', maxCount: 1 },
  { name: 'cardBannerImage2', maxCount: 1 },
  { name: 'cardBannerImage3', maxCount: 1 }
]), adminController.updateBanner);
router.delete('/banner/:id', adminController.deleteBanner);

router.get("/", adminController.renderForm);
router.post("/submit", upload.fields([
  { name: 'categoryImage', maxCount: 1 },
  { name: 'subcategoryImage', maxCount: 1 },
  { name: 'productImage', maxCount: 1 },
  { name: 'images', maxCount: 50 }
]), adminController.submitData);
router.get('/data',adminController.getJsonData);
// router.post('/data',adminController.addToJsonData);
// Category routes
router.put('/category/:id',upload.fields([{ name: 'image', maxCount: 1 }]), adminController.updateCategory);
// Accept POST as well for forms that submit without method-override
router.post('/category/:id', upload.fields([{ name: 'image', maxCount: 1 }]), adminController.updateCategory);
router.delete('/category/:id', adminController.deleteCategory);

// Subcategory routes
router.put('/subcategory/:id',upload.fields([{ name: 'image', maxCount: 1 }]), adminController.updateSubcategory);
// Accept POST as well for form submission
router.post('/subcategory/:id', upload.fields([{ name: 'image', maxCount: 1 }]), adminController.updateSubcategory);
router.delete('/subcategory/:id', adminController.deleteSubcategory);

// Product routes
// Accept multiple image fields: mainImage, thumbnailImage, images[] and keep compatibility with legacy 'image'
const productUploadFields = [
  { name: 'mainImage', maxCount: 1 },
  { name: 'thumbnailImage', maxCount: 1 },
  // accept multiple images as an array (set a practical upper limit)
  { name: 'images', maxCount: 50 },
  { name: 'image', maxCount: 1 }
];
router.put('/product/:id', upload.fields(productUploadFields), adminController.updateProduct);
// Accept POST as well (some forms may POST directly)
router.post('/product/:id', upload.fields(productUploadFields), adminController.updateProduct);
router.delete('/product/:id', adminController.deleteProduct);

router.post('/subcategory/bulk', upload.fields([
  { name: 'subcategoryImage', maxCount: 1 },
  { name: 'productImages' }
]), adminController.addSubcategoryWithProducts);

router.get('/category/:id', adminController.getSubcategories);
router.get('/subcategory', adminController.getProductsBySubcategory);
router.get('/edit-category', adminController.renderEditCategory);
router.get('/edit-category/:id', adminController.renderEditCategory);
 // Add to cart route

// Products management routes
router.get('/products', adminController.renderProducts);
router.get('/edit-product/:id', adminController.renderEditProduct);
router.post('/admin/update-product/:id', upload.fields(productUploadFields), adminController.updateProduct);

// Orders route
router.get('/orders', orderController.getAllOrders);
router.put('/orders/:id/status', orderController.updateOrderStatus);
// Revenue (admin) page and data
router.get('/revenue', orderController.renderRevenuePage);
router.get('/revenue/data', orderController.getRevenueData);

module.exports = router;
