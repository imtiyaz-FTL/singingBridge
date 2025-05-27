const { check } = require("express-validator");

const registerValidator = [
  check("name", "Name is required").notEmpty(),
  check("email", "Please include a valid email address")
    .isEmail()
    .normalizeEmail({ gmail_remove_dots: true }),
  check("password", "Password is required")
    .notEmpty()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  check("mobile", "Mobile number is required")
    .notEmpty()
    .isLength({ min: 10, max: 10 })
    .withMessage("Mobile number length should be 10 digits"),
];


const loginValidator = [
  check("email")
    .isEmail()
    .normalizeEmail({
      gmail_remove_dots: true,
    })
    .withMessage("Please enter a valid email"),
  check("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

const updatePassword = [
  check("newPassword")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  check("oldPassword")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

const updateProfile = [
  check("name").notEmpty().withMessage("Name is required"),
  check("mobile")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 10 })
    .withMessage("mobile number length should be 10 digit"),
];

const forgetPassword = [
  check("email")
    .isEmail()
    .normalizeEmail({
      gmail_remove_dots: true,
    })
    .withMessage("Please enter a valid email"),
];

const resetPassword = [
  check("email")
    .isEmail()
    .normalizeEmail({ gmail_remove_dots: true })
    .withMessage("Please enter a valid email"),
  check("newPassword")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  check("otp")
    .notEmpty()
    .withMessage("OTP is required")
    .isLength({ min: 6 })
    .withMessage("OTP must be at least 6 characters long"),
];



module.exports = {
  registerValidator,
  loginValidator,
  updatePassword,
  updateProfile,
  forgetPassword,
  resetPassword,

};
