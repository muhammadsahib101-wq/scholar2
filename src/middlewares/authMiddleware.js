const jwt = require("jsonwebtoken");

function verifyTokenAsync(token, secret) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (error, decoded) => {
      if (error) return reject(error);
      resolve(decoded);
    });
  });
}

function authMiddleware(request, response, next) {
  const token = request.header("Authorization")?.split(" ")[1];
  console.log("Received Token:", token);

  if (!token) {
    return response
      .status(401)
      .json({ message: "Access Denied. No token received." });
  }

  verifyTokenAsync(token, process.env.JWT_SECRET)
    .then((decoded) => {
      request.user = decoded;
      next();
    })
    .catch((error) => {
      console.error("JWT verification error:", error);
      if (error.name === "TokenExpiredError") {
        return response
          .status(401)
          .json({ message: "Token expired. Please log in again." });
      }
      return response.status(400).json({ message: "Invalid token." });
    });
}

module.exports = authMiddleware;
