const User = require("../../models/userModel");
const bcryptjs = require("bcryptjs");
// const ErrorHander=require("../../utils/errorHandler")
const catchAsync = require("../../middleware/catchAsyncErrors")
const { JWT_SECRET, EMAIL_PASSWORD, EMAIL_USER } = require("../../config");
// const session = require('express-session');
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
// const Wallet=require("../../models/walletModel")
const { check, validationResult } = require("express-validator");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid"); // For generating unique IDs
//send email
const sendResetPasswordMail = async (name, email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      // requireTLS: true,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: EMAIL_USER,
      to: email,
      subject: `Password Reset OTP: ${otp}`,
      html: `<h1>Hi ${name},</h1><br/> <p>Below is your OTP: <strong>${otp}</strong> to reset your password. If you didn't request this, you may ignore this email.</p>`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Mail has been sent:", info.response);
      }
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

// password Hash
const securePassword = async (password) => {
  try {

    const passwordHash = await bcryptjs.hash(password, 10);

    return passwordHash;
  } catch (error) {
    res.status(400).send(error.message);
  }
};

//creat token 
const creat_token = async (id, role, email) => {
  try {
    const token = await jwt.sign({ _id: id, role: role, email }, JWT_SECRET);

    return token;
  } catch (error) {
    res.status(400).send(error.message);
  }
};
//register user
const register_user = async (req, role, res) => {
  try {
    console.log(req.body, "Request Body");

    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors.array(),
      });
    }

    // Secure the password
    const spassword = await securePassword(req.body.password);
    // console.log(spassword, "Secured Password");

    // Destructure request body
    const { name, mobile,  password, email,confirmPassword,inviteCode} = req.body;

    // Check for required fields
    if (!password || !name || !email || !confirmPassword  ) {
      return res.status(400).send({
        success: false,
        message: "Name, password, email, mobile, confirmPassword must be provided",
      });
    }

    // Check for duplicate mobile
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send({ success: false, message: "This email is already in use" });
    }

   
 if (password !== confirmPassword) {
      return res.status(400).send({
        success: false,
        message: "Password and confirm password do not match",
      });
    }
   
    let deviceId = uuidv4(); // Generate a unique device ID
    // Create new user
    const user = new User({
      name,
      email,
      mobile,
      password: spassword,
      confirmPassword: spassword, // Assuming confirmPassword is the same as passwor
      role,
      online: true,
      lastActivity: new Date(),
     inviteCode: inviteCode , // Generate a unique invite code if not provided
      deviceId:deviceId,
      isLoggedIn:true
    });

    // Save user and create token
    const user_data = await user.save();
    user_data.inviteCode = user_data._id;
    await user_data.save();

    const tokenData = await creat_token(user_data._id, user_data.role, user_data.email);
    const userResult = {
      _id: user_data._id,
      role: user_data.role,
      email: user_data.email,
      name: user_data.name,
      mobile: user_data.mobile,
      token: `Bearer ${tokenData}`,
      deviceId:user_data.deviceId,
      isLoggedIn:true,
     
    };

    const res_data = {
      success: true,
      message: "user details",
      data: userResult,
    };

    res.status(200).json({
      success: true,
      message: "User registered successfully",
      data: res_data,
    });
  } catch (error) {
    return res.status(400).send({ success: false, message: error.message });
  }
};

//register admin
const register_admin = async (req, role, res) => {
  try {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors.array(),
      });
    }

    const spassword = await securePassword(req.body.password);

    const user = new User({
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mobile,
      gender: req.body.gender,
      password: spassword,
      image: req.file.filename,
      role,
    });

    const userData = await User.findOne({ email: req.body.email });

    if (userData) {
      res
        .status(400)
        .send({ success: false, message: "This email is already exists" });
    } else {
      const user_data = await user.save();
      const tokenData = await creat_token(
        user_data._id,
        user_data.role,
        user_data.email
      );
      res.status(200).send({ success: true, data: user_data, token: `Bearer ${tokenData}`, });
    }
  } catch (error) {
    res.status(400).send({ success: false, message: error.message });
  }
};

//login  
const login_user = (async (req, role, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors.array(),
      });
    }

    const email = req.body.email;
    const password = req.body.password;
    // const deviceId=req.body.deviceId

    const userData = await User.findOne({ email: email });


    if (userData) {
      if (userData.blocked === true) {
        return res.status(400).json({
          success: false,
          message: `you are not allowed to access this page`,
        });
      }

      if (userData.role !== role) {
        return res.status(400).json({
          success: false,
          message: `you are not allowed to access this page`,
        });
      }

      const passwordMatch = await bcryptjs.compare(password, userData.password);
      // console.log(passwordMatch, "kkkk")

      if (passwordMatch) {
       
        const tokenData = await creat_token(
          userData._id,
          userData.role,
          userData.email
        );
        const updatedUser = await User.findByIdAndUpdate(
          userData._id,
          { isLoggedIn:true , deviceId: userData.deviceId || uuidv4() }, // Ensure deviceId is set
          { new: true } // Return the updated user document
        );
        const userResult = {
          _id: userData._id,
          role: userData.role,
          email: userData.email,
          name: userData.name,
          mobile: userData.mobile,
          // image: imageUrl,
          token: `Bearer ${tokenData}`,
          deviceId: updatedUser.deviceId,
        };
      
        const response = {
          success: true,
          message: "user details",
          data: userResult,
        };

        res.status(200).send(response);
      } else {
        res
          .status(400)
          .send({ success: false, message: "Login details are incorrect" });
      }
    } else {
      res
        .status(400)
        .send({ success: false, message: "Login details are incorrect" });
    }
  } catch (error) {
    return res.status(400).send({ success: false, message: error.message });
  }


});

//update_password
const update_password = async (req, res) => {
  try {
    // console.log("kakaka")
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors.array(),
      });
    }
    const oldPassword = req.body.oldPassword;
    const password = req.body.newPassword;

    if (!oldPassword || !password) {
      return res.status(400).send({
        success: false,
        message: "Both user_id and password must be provided",
      });
    }

    const userId = req.user._id;
    let data = await User.findById(userId);

    if (data) {
      const passwordMatch = await bcryptjs.compare(oldPassword, data.password);
      if (passwordMatch) {
        const newpassword = await securePassword(password);

        const userData = await User.findByIdAndUpdate(
          { _id: userId },
          {
            $set: {
              password: newpassword,
              confirmPassword: newpassword, // Assuming confirmPassword is the same as password
            },
          }
        );

        res.status(200).json({
          success: true,
          message: "Password Updated Successfully!",
        });
      } else {
        res
          .status(400)
          .json({ success: false, message: "Your password is wrong" });
      }
    } else {
      res.status(400).json({ success: false, message: "User Id not found" });
    }
  } catch (error) {
    res.status(400).send({ success: false, message: error.message });
  }
};

//update_profile
const update_profile = async (req, role, res) => {
  try {
    // Validate the request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors.array(),
      });
    }

    // Extract user ID from the authenticated request
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    // Fetch the user by ID
    const userData = await User.findById(userId);
    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if the user's role matches the required role
    if (userData.role !== role) {
      return res.status(403).json({
        success: false,
        message: "Access denied: insufficient permissions",
      });
    }

    // Update user information
    const { name, mobile,email } = req.body;

    // Optional: Validate and sanitize inputs
    if (!name || !mobile || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and mobile email are required fields",
      });
    }

    userData.name = name;
    userData.mobile = mobile;
    userData.profileInf = profileInf || userData.profileInf; // Update only if provided
    userData.country = country || userData.country; // Update only if provided

    // Save the updated user data to the database
    const updatedUserData = await userData.save();

    // Respond with success
    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUserData,
    });
  } catch (error) {
    // Catch unexpected errors and return a server error response
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating the profile",
      error: error.message,
    });
  }
};
const uploadProfileImage = async (req,role, res) => {
  try {
    const userId = req.user._id; // set by your auth middleware
    const userData = await User.findById(userId);
console.log("kkkkkkkkkk")
    if (!userData) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (userData.role !== "user" && userData.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image uploaded" });
    }

    // Save the image filename
    userData.profilePic = req.file.filename;
    await userData.save();

    res.status(200).json({
      success: true,
      message: "Profile image updated successfully",
      data: {
        _id: userData._id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        profilePic: userData.profilePic,
        profilePicUrl: `${req.protocol}://${req.get("host")}/public/userImages/${userData.profilePic}`,
      },
    });
  } catch (error) {
    console.log("kkkkkkkkkk")
    res.status(500).json({ success: false, message: error.message });
  }
};

const update_user_Profile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors.array(),
      });
    }

    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    const userData = await User.findById(userId);
    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Role check if needed
    if (req.role && userData.role !== req.role) {
      return res.status(403).json({
        success: false,
        message: "Access denied: insufficient permissions",
      });
    }

    const { name, mobile, email, oldPassword, newPassword } = req.body;

    // --- Profile update logic ---
    if (name) userData.name = name;
    if (mobile) userData.mobile = mobile;
    if (email) userData.email = email;
   
   

    // --- Password update logic ---
    if (oldPassword && newPassword) {
      const isMatch = await bcryptjs.compare(oldPassword, userData.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Old password is incorrect",
        });
      }
      const hashedPassword = await securePassword(newPassword);
      userData.password = hashedPassword;
      userData.confirmPassword = hashedPassword; // if required
    } else if (oldPassword || newPassword) {
      return res.status(400).json({
        success: false,
        message: "Both oldPassword and newPassword are required to change the password",
      });
    }

    await userData.save();

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: userData,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating user",
      error: error.message,
    });
  }
};


const getProfile = async (req, role, res) => {
  try {
    const userId = req.user._id;

    let userData = await User.findById(userId).select("-password -otp -confirmPassword");

    if (!userData) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Create a copy so we don't mutate the original in DB
    const userDataObj = userData.toObject();

    // Only modify the returned object, not the saved DB record
    if (userDataObj.profilePic && !userDataObj.profilePic.startsWith("http")) {
      userDataObj.profilePic = `${req.protocol}://${req.get("host")}/public/userImages/${userDataObj.profilePic}`;
    }

    res.status(200).json({
      success: true,
      message: "User profile fetched successfully",
      data: userDataObj,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//forgot_password
const forgot_password = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors.array(),
      });
    }
    const email = req.body.email;
    if (!email) {
      return res.status(400).send("email must be provided");
    }

    const userData = await User.findOne({ email: email });

    if (userData) {
      // Generate a 6-digit OTP
      const otp = Math.floor(Math.random() * 900000) + 100000;
      const data = await User.updateOne(
        { email: email },
        { $set: { otp: otp } }
      );

      sendResetPasswordMail(userData.name, userData.email, otp);

      res.status(200).send({
        success: true,
        message: "OTP has been sent to your registered Email",
      });
    } else {
      res.status(400).send({
        success: false,
        message: "No account associated with this email",
      });
    }
  } catch (error) {
    res.status(400).send({ success: false, message: error.message });
  }
};

//reset_password
const reset_password = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors.array(),
      });
    }

    const { otp, password, email } = req.body;
    if (!password || !otp || !email) {
      return res.status(400).send({
        success: false,
        message: "Both otp, password, and email must be provided",
      });
    }

    const otpData = await User.findOne({ email });

    if (otpData && otpData.otp === otp) {
      const newPassword = await securePassword(password);
      const userData = await User.findByIdAndUpdate(
        { _id: otpData._id },
        { $set: { password: newPassword, otp: "" } },
        { new: true }
      );
      res
        .status(200)
        .send({ success: true, message: "Password has been reset." });
    } else {
      res
        .status(400)
        .send({ success: false, message: "Invalid OTP or email." });
    }
  } catch (error) {
    res.status(400).send({ success: false, message: error.message });
  }
};

//resend_otp
const resend_otp = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors.array(),
      });
    }
    const email = req.body.email;
    if (!email) {
      return res.status(400).send("email must be provided");
    }

    const userData = await User.findOne({ email: email });

    if (userData) {
      // Generate a 6-digit OTP
      const otp = Math.floor(Math.random() * 900000) + 100000;
      const data = await User.updateOne(
        { email: email },
        { $set: { otp: otp } }
      );

      sendResetPasswordMail(userData.name, userData.email, otp);

      res.status(200).send({
        success: true,
        message: "OTP has been sent to your registered Email",
      });
    } else {
      res.status(400).send({
        success: false,
        message: "No account associated with this email",
      });
    }
  } catch (error) {
    res.status(400).send({ success: false, message: error.message });
  }
};
//get_all_user
const get_all_user = async (req, res) => {
  try {
    const users = await User.find({ role: "user" }).select(
      "-password -role -otp -confirmPassword"
    );

    const baseUrl = `${req.protocol}://${req.get("host")}/public/userImages/`;

    const modifiedUsers = users.map((user) => {
      const userObj = user.toObject();
      if (userObj.profilePic && !userObj.profilePic.startsWith("http")) {
        userObj.profilePic = baseUrl + userObj.profilePic;
      }
      return userObj;
    });

    res.status(200).send({
      success: true,
      data: modifiedUsers,
    });
  } catch (error) {
    res.status(400).send({ success: false, message: error.message });
  }
};

const getProfileById = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Find user by ID, excluding sensitive fields
    const user = await User.findById(userId).select(
      "-password -otp -confirmPassword"
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Convert to plain object to safely modify
    const userObj = user.toObject();

    // Construct full profilePic URL if needed
    if (userObj.profilePic && !userObj.profilePic.startsWith("http")) {
      userObj.profilePic = `${req.protocol}://${req.get("host")}/public/userImages/${userObj.profilePic}`;
    }

    res.status(200).json({
      success: true,
      data: userObj,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



const get_all_admin = async (req, res) => {
  try {
    // console.log("kkkkkkkkkkkkkkkkkkkkkk")
    const users = await User.find({ role: "admin" }).select(
      "-password -role -otp"
    );
    res.status(200).send({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(400).send({ success: false, message: error.message });
  }
};

//blocked user
const blocked = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if(user.blocked){
      user.blocked = false;
      await user.save();
      return res
        .status(200)
        .json({ success: true, message: "User is unblocked " });
    }else{
      user.blocked = true;
      await user.save();
      return res
        .status(200)
        .json({ success: true, message: "User is blocked " });
    }
   

   
  } catch (error) {
    res.status(400).send({ success: false, message: error.message });
  }
};

// Unblocking a user
const unBlocked = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    user.blocked = false;
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "User unblocked successfully" });
  } catch (error) {
    res.status(400).send({ success: false, message: error.message });
  }
};


const updateUserActivity = async (username) => {
  if (!username) {
    throw new Error('Username is required');
  }
  return User.findOneAndUpdate(
    { username },
    { username, online: true, lastActivity: new Date() },
    { upsert: true, new: true }
  );
};

const getOnlineUsers = async () => {
  // console.log("hiiiiii")
  return User.find({
    lastActivity: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
  });
};

const markUsersOffline = async () => {
  return User.updateMany(
    { lastActivity: { $lt: new Date(Date.now() - 5 * 60 * 1000) } },
    { online: false }
  );
};

// const getUserByName=async(req,res)=>{
//   try {
//     const {username} = req.params.username;
//     const user = await User.findOne({ username });
//     if (!user) {
//       return res
//        .status(404)
//        .json({ success: false, message: "User not found" });
//     }
//     res.status(200).send({
//       success: true,
//       data: user,
//     });
// }catch(error){
//   res.status(400).send({ success: false, message: error.message });
// }
// }

const getUserByName = async (req, res) => {
  try {
    const { username } = req.params;
    const regex = new RegExp(`^${username}`, 'i'); // Case-insensitive match starting with the input

    const users = await User.find({ username: regex });

    if (users.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No users found" });
    }

    res.status(200).send({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(400).send({ success: false, message: error.message });
  }
};

const get_user_by_id = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Find user by ID, excluding sensitive fields like password, role, and otp
    const user = await User.findById(userId).select('-password -role -otp');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Respond with success and user data
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    // Handle any errors that occur during the process
    res.status(500).json({ success: false, message: error.message });
  }
};


const userRatingOrder=async(rea,res)=>{
  try{
    const users = await User.find().sort({ rating: -1 }); // -1 for descending order
    res.status(200).send({ success: true, data: users });
  }catch(error){
    res.status(500).json({ success: false, message: error.message });
  }
}

const deleteUser=async(req,res)=>{
  try{
    const userId = req.params.userId;
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).send({ success: true, message: 'User deleted successfully' });
  }catch(error){
    res.status(500).json({ success: false, message: error.message });
  }
}

const updateUserStatus = async (req, res) => {
  const { status, message } = req.body;
  const userId = req.params.userId;
  
  try {
    // Ensure that the status value is valid
    const validStatuses = ["blocked", "unblocked", "flag", "unflag"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    // Find and update the user
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          "userStatus.status": status,
          "userStatus.message": message,
          "userStatus.time": Date.now(),
        },
      },
      { new: true } // Return the updated document
    );

    // If the user is not found
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Successfully updated the user status
    return res.status(200).json({ success: true, data: user });

  } catch (error) {
    // Handle errors (e.g., database connection issues)
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateUserCoinOrrating = async (req, res) => {
  const { dynamoCoin, rating } = req.body;
  const userId = req.params.userId;
  
  try {
    // Prepare update object
    const updateFields = {};

    // If dynamoCoin and rating are provided, update them
    if (dynamoCoin !== undefined) {
      updateFields.dynamoCoin = dynamoCoin;
    }
    if (rating !== undefined) {
      updateFields.rating = rating;
    }

    // Ensure that at least one field is provided for update
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ success: false, message: "Please provide either dynamoCoin or rating to update" });
    }

    // Find and update the user
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true } // Return the updated document
    );

    // If the user is not found
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Successfully updated the dynamoCoin and/or rating
    return res.status(200).json({ success: true, data: user });

  } catch (error) {
    // Handle errors (e.g., database connection issues)
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateAllUsersIsLoggedIn = async (req, res) => {
  try {
    // Update all users and set isLoggedIn to true
    const result = await User.updateMany({}, { isLoggedIn: true });

    // Respond with the number of documents modified
    return res.status(200).json({
      success: true,
      message: "All users updated successfully.",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    // Handle errors
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const updateAlluserDeviceId=async(req,res)=>{
  try {
    const deviceId=Math.floor(new Date()/1000)
    const updatedUserDataWIthDeviceId=await User.updateMany({},{deviceId:deviceId})
     res.status(200).json({
      success: true,
      message: "All users updated successfully.",
      modifiedCount: updatedUserDataWIthDeviceId.modifiedCount,
    })
    
  } catch (error) {
    res.status(404).json({
      success: false,
      message: "Server error",
      error: error.message,
    })
  }
}

const logout=async(req,res)=>{
  try {
    const userId = req.params.userId;
    const user = await User.findByIdAndUpdate(
      userId,
      { isLoggedIn: false,deviceId:"" },
      { new: true } // Return the updated document
    );

    
    // If the user is not found
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Successfully updated the user status
    return res.status(200).json({ success: true, data: user });

  } catch (error) {
    // Handle errors (e.g., database connection issues)
    return res.status(500).json({ success: false, message: error.message });
  }
}


const googleCallback = async (req, res) => {
  try {
    const user_jsonGoogleCallback = req.user;
    const user_data_google = user_jsonGoogleCallback._json;
    console.log("Google user data:", user_data_google);

    const existingUser = await User.findOne({ email: user_data_google.email });
    console.log("Existing user:", existingUser);

    if (existingUser) {
      const tokenData = await creat_token(
        existingUser._id,
        existingUser.role,
        existingUser.email
      );
      const bearerToken = `Bearer ${tokenData}`;
      console.log("Bearer Token:", bearerToken);

 
    return res.redirect(`https://dynamochess.in/auth-success?token=${encodeURIComponent(bearerToken)}`);
    }

    const user = new User({
      name: user_data_google.name,
      username: user_data_google.name,
      email: user_data_google.email,
      mobile: "null",
      country: "null",
      password: user_data_google.sub,
      countryIcon: user_data_google.picture,
      role: "user",
      online: true,
      lastActivity: new Date(),
      dynamoCoin: 1500,
      deviceId: user_data_google.sub,
      isLoggedIn: true,
      googleId: user_data_google.sub,
      image: user_data_google.picture,
    });

    const savedUser = await user.save();

    const tokenData = await creat_token(
      savedUser._id,
      savedUser.role,
      savedUser.email
    );

    const bearerToken = `Bearer ${tokenData}`;
    console.log("Bearer Token (new user):", bearerToken);

    return res.redirect(`https://dynamochess.in/auth-success?token=${encodeURIComponent(bearerToken)}`);
  } catch (error) {
    console.error("Google callback error:", error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({ error: `Duplicate field value: ${field}` });
    } else {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
};






module.exports = {
  register_user,
  register_admin,
  login_user,
  update_password,
  update_profile,
  forgot_password,
  reset_password,
  resend_otp,
  get_all_user,
  get_all_admin,
  blocked,
  unBlocked,
  updateUserActivity,
  getOnlineUsers,
  markUsersOffline,
  getUserByName,
  get_user_by_id,
  userRatingOrder,
  deleteUser,
  updateUserStatus,
updateUserCoinOrrating,
updateAllUsersIsLoggedIn,
updateAlluserDeviceId,
logout,
googleCallback,
uploadProfileImage,
getProfile,
getProfileById,
update_user_Profile
};
