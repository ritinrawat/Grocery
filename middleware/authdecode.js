const jwt = require('jsonwebtoken');

const authedecode = (req, res, next) => {
  console.log("authedecode middleware triggered"); // 🔹 debug log
  try {
    const authHeader = req.headers.authorization;
    // console.log("Authorization header:", req.headers.authorization); // 🔹 debug log
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Invalid token format' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log("Decoded token:", decoded._id);

    req.userId = decoded._id;
    next();
  } catch (error) {
    console.log("JWT error:", error.message); // 🔹 debug JWT errors
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = authedecode;
