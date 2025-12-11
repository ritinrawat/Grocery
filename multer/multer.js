const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder: "blinkit-admin",  // You can rename folder anytime
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    public_id: `${Date.now()}-${file.originalname}`
  }),
});

// Multer Middleware
const upload = multer({ storage });

module.exports = upload;
