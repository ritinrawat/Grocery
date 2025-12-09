const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");     // For hashing & comparing passwords
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    name:{
      type:String,
      required:true,
      trim:true
    },
      number:{
      type:Number,
      required:true,
  
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
    type: String,
    required: true,
    select: false,
  },
   
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT
userSchema.methods.generateAuthToken = function () {
  return jwt.sign({ _id: this._id }, process.env.JWT_SECRET, { expiresIn: "24d" });
};

// Hash password (static)
userSchema.statics.hashPassword = async function (password) {
  return await bcrypt.hash(password, 10);
};

// userSchema.methods.generateAccessToken = function () {
//   return jwt.sign({ _id: this._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
// };

// userSchema.methods.generateRefreshToken = function () {
//   return jwt.sign({ _id: this._id }, process.env.REFRESH_SECRET, { expiresIn: '24d' });
// };

// Pre-save hook to hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
module.exports = mongoose.model("User", userSchema);
