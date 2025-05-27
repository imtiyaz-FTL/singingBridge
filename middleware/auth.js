const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");

const verifyToken = async (req, res, next) => {
  const token =
    req.body.token || req.query.token || req.headers["authorization"];

  if (!token) {
    return res
      .status(401)
      .send({ success: false, msg: "A Token is required for authorization" });
  }

  try {
    const decoded = await jwt.verify(token.replace("Bearer ", ""), JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).send({ success: false, msg: "Invalid Token" });
  }
};

module.exports = verifyToken;
