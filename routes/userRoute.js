
const express = require("express");
const multer = require("multer");
const bodyParser = require("body-parser");
const path = require("path");
const passport = require("passport"); 
const {
  register_user,
  login_user,
  register_admin,
  update_password,
  update_profile,
  forgot_password,
  reset_password,
  resend_otp,
  get_all_user,
  get_all_admin,
  blocked,
  unBlocked,
  getUserByName,
  get_user_by_id,
  userRatingOrder,
  deleteUser,
  updateUserStatus,
updateUserCoinOrrating,
updateAllUsersIsLoggedIn,
updateAlluserDeviceId,
logout,
userDeleteWhileLoggedIn,
googleCallback
} = require("../controllers/auth/userController");
const {
  // registerValidator,
  loginValidator,
  updatePassword,
  updateProfile,
  resetPassword,
  forgetPassword,
} = require("../helpers/index");
const auth = require("../middleware/auth");
const { user_auth, serializeUser, checkRole } = require("../utils/authUtils");

const userRoute = express.Router();

userRoute.use(bodyParser.urlencoded({ extended: true }));
userRoute.use(bodyParser.json());
userRoute.use(express.static("public"));

// const path = require("path");


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(
      null,
      path.join(__dirname, "../public/userImages"),
      function (error, sucess) {
        if (error) throw error;
      }
    );
  },
  filename: function (req, file, cb) {
    const name = Date.now() + "_" + file.originalname;
    cb(null, name, function (error1, sucess1) {
      if (error1) throw error1;
    });
  },
});

const upload = multer({ storage: storage });


userRoute.get('/', (req, res) => {
  res.send('Products API running. New deploy.');
});

userRoute.get('/ping', (req, res) => {
  res.send('PONG');
});

//register user
// upload.single("image"),
userRoute.post("/register",(req, res) => register_user(req, "user", res));

 //register admin
userRoute.post(
  "/register-admin",
  upload.single("image"),
  // registerValidator,
  (req, res) => register_admin(req, "admin", res)
);

//login user
userRoute.post("/login", loginValidator,  (req, res) => login_user(req, "user", res));

 //login admin
userRoute.post("/login-admin",  (req, res) =>
  login_user(req, "admin", res)
);

//profile route
userRoute.get("/profile", user_auth, async (req, res) => {
  try {
    const userData = await serializeUser(req.user, req); // pass req for image URL
    res.status(200).json(userData);
  } catch (error) {
    console.error("Error in /profile:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// Add more routes here...

//update-password
userRoute.post("/update-password", user_auth, updatePassword, (req, res) =>
  update_password(req, res)
);

//update-profile-user

userRoute.post(
  "/update-profile-user",
  user_auth,
  upload.single("image"),
  updateProfile,
  (req, res) => update_profile(req, "user", res)
);

//update-profile-admin
userRoute.post(
  "/update-profile-admin",
  upload.single("image"),
  user_auth,
  updateProfile,
  (req, res) => update_profile(req, "admin", res)
);

//forget password
userRoute.post("/forget-password",forgetPassword, (req, res) =>
  forgot_password(req, res)
);

//reset password
userRoute.post("/reset-password", resetPassword, async (req, res) =>
  reset_password(req, res)
);

//resend otp
userRoute.post("/resend-otp", forgetPassword, async (req, res) =>
  resend_otp(req, res)
);

//get all user
userRoute.get(
  "/all-users",

  async (req, res) => get_all_user(req, res)
);
//get_user_by_id
userRoute.get(
  "/get_user_by_id/:userId",
  async (req, res) => get_user_by_id(req, res)
);
//get all admin
userRoute.get(
  "/all-admin",
  user_auth,
  checkRole(["admin"]),
  async (req, res) => get_all_admin(req, res)
);

//blocked user
userRoute.post(
  "/block/:userId",
  user_auth,
  async (req, res) => blocked(req, res)
);

// Unblocking a user
userRoute.post(
  "/unblock/:userId",
  user_auth,
  checkRole(["admin"]),
  async (req, res) => unBlocked(req, res)
);
userRoute.delete(
  "/delete/:userId",
  user_auth,
  async (req, res) => deleteUser(req, res)
);


userRoute.get("/google", passport.authenticate("google", ["profile", "email"]));
userRoute.get("/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  async (req, res) => googleCallback(req, res)
);

//get user by name

userRoute.get("/getUserByName/:username",async(req,res)=>getUserByName(req,res))
userRoute.get("/getUserRatingOredr",async(req,res)=>userRatingOrder(req,res))
userRoute.post('/status/:userId',async(req,res)=> updateUserStatus(req,res));
userRoute.post('/update-User-Coin-Or-Rating/:userId',async(req,res)=> updateUserCoinOrrating(req,res));
userRoute.put("/updateAllUserLoggedIn",async(req,res)=>updateAllUsersIsLoggedIn(req,res))
userRoute.put("/updateAlluserDeviceId",async(req,res)=>updateAlluserDeviceId(req,res))
userRoute.get("/logout/:userId",user_auth,async(req,res)=>logout(req,res))
userRoute.get("/userDeleteWhileLoggedIn/:userId",user_auth,async(req,res)=>userDeleteWhileLoggedIn(req,res))
module.exports = userRoute;
