const mongoose = require("mongoose");

const user = mongoose.Schema(
  {
    name: {
      type: String,
     
    },
    email: {
      type: String,
      required: true,
      unique: true,
            match: [
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/,
        "Please fill a valid email address",
      ],
    },
    password: {
      type: String,
      required: true,
      minLength: [6, "Password should be greater than 6 characters"],
    },
    confirmPassword: {
      type: String,
      required: true,
      minLength: [6, "Password should be greater than 6 characters"],
    },
   
    mobile: {
      type: String,
      default: "",
   
    },
    role: {
      type: String,
      // enum: ["user", "admin"],
      enum: ["user", "admin", "teacher"], // Define all possible roles here
      default: "user", // Default role is "user"
    },
    otp: {
      type: String,
      default: "",
    },
    blocked:{
      type : Boolean,
      default : false,
    },
    userStatus: {
      status: {
        type: String,
        enum: ["blocked", "unblocked", "flag", "unflag"], // Consistent naming for enum values
        default: "unflag", // Use a meaningful default status
        // required: true, // Ensures the status field is always set
      },
      message: {
        type: String,
        default: "", // Default remains optional
        trim: true, // Removes unnecessary whitespace
      },
      time: {
        type: Date,
        default: () => Date.now(), // Ensures the correct execution of `Date.now`
      },
    },    
   
    online:Boolean,
    lastActivity: {
      type: Date,
      default: Date.now,
    },
   
   
    inviteCode: { 
      type: String,
    },
    profileInf: { 
      type: String,
      default: "",
    },
    profilePic: {
      type: String,
      default: "",
    },
    isLoggedIn: {
      type: Boolean,
      default: false, // Default to false
    },
    deviceId:{
      type: String,
    }
  
  },
  
  { versionKey: false }
);

module.exports = mongoose.model("User", user);
