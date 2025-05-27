const passport = require("passport");
const { JWT_SECRET } = require("../config");
const jwt = require("jsonwebtoken");

// Passport middleware
const user_auth = passport.authenticate("jwt", { session: false });
console.log("useer_auth", user_auth);

const creat_token = async (id, role, email) => {
  try {
    const token = await jwt.sign({ _id: id, role, email }, JWT_SECRET);
    return token;
  } catch (error) {
    // Don't use res here, as it's not in scope. Just throw the error.
    throw new Error(error.message);
  }
};

const serializeUser = async (user, req = null) => {
  console.log("serializeUser", user);
  const imageUrl = user.image && req
    ? `${req.protocol}://${req.get("host")}/public/userImages/${user.image}`
    : null;

  const id = user._id;
  const role = user.role;
  const email = user.email;

  const token = await creat_token(id, role, email);
  console.log("Generated Token:", token);

  return {
    _id: user._id,
    role: user.role,
    email: user.email,
    name: user.name,
    mobile: user.mobile,
    image: imageUrl,
    countryIcon: user.countryIcon,
    country: user.country,
    dynamoCoin: user.dynamoCoin,
    Rating: user.rating,
    profileInf: user.profileInf,
    blocked: user.blocked,
    userStatus: user.userStatus,
    deviceId: user.deviceId,
    isLoggedIn: user.isLoggedIn,
    token: `Bearer ${token}`,
  };
};

/**
 * @DESC Check Role Middleware
 */
const checkRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(401).json({
      success: false,
      message: `You are not allowed to access this page`,
    });
  }
  next();
};

module.exports = {
  user_auth,
  serializeUser,
  checkRole,
};
