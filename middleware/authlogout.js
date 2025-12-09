const jwt = require("jsonwebtoken");

// Auth middleware
const authMiddleware = (req, res, next) => {
  try {
    // Get token from cookies or Authorization header
    const token =
      req.cookies?.token ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null);

    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request (optional)
    req.user = decoded;

    next(); // pass control to next middleware/controller
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

module.exports = authMiddleware;
