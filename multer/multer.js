const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("./cloudinary");

// Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder: "blinkit-admin",  // You can rename folder anytime
    allowed_formats: ["jpg", "jpeg", "png", "webp", "avif"],
    public_id: `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9]/g, '_')}`
  }),
});

// Multer Middleware
const upload = multer({ storage });

module.exports = upload;
