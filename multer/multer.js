const multer = require('multer');
const { v4: uuidv4 } = require('uuid'); // generate unique IDs
const path = require('path');
const unique = uuidv4();
// Multer storage setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/uploads'); // upload location
  },
  filename: function (req, file, cb) {
    const unique = uuidv4(); // generate unique name
    cb(null, unique + path.extname(file.originalname)); // e.g. "abc123.png"
  }
});

// Create upload instance
const upload = multer({ storage: storage });

module.exports = upload;
