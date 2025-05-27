const express = require("express");
const multer = require("multer");
const bodyParser = require("body-parser");
const path = require("path");
const { createBanner,getBanner,deleteBanner,updateBanner } = require("../controllers/Banner/bannerController");
const { validationResult } = require('express-validator');  // Ensure this is required

const auth = require("../middleware/auth");
const { user_auth, serializeUser, checkRole } = require("../utils/authUtils");

const bannerRoute = express.Router();

bannerRoute.use(bodyParser.urlencoded({ extended: true }));
bannerRoute.use(bodyParser.json());
bannerRoute.use(express.static("public"));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/bannerImages"), function (error, success) {
      if (error) throw error;
    });
  },
  filename: function (req, file, cb) {
    const name = Date.now() + "_" + file.originalname;
    cb(null, name, function (error1, success1) {
      if (error1) throw error1;
    });
  },
});

const upload = multer({ storage: storage });

bannerRoute.get('/ping', (req, res) => {
  res.send('PONG');
});

// getRule route
// bannerRoute.get("/getBanner/:title", (req, res) => getBanner(req, res));
// bannerRoute.get("/getBanner/:type", (req, res) => getBanner(req, res));
bannerRoute.get("/getBanner", (req, res) => getBanner(req, res));
// setRule with multiple images by admin
bannerRoute.post(
  "/setBanner",
  upload.array("images", 10),  // Adjust the limit as needed
  (req, res) => createBanner(req, res)
);// deleteRule route
bannerRoute.post("/deleteBanner/:id", (req, res) => deleteBanner(req, res));
bannerRoute.put(
  "/updateBanner/:id",
  upload.array("images", 10), // Max 10 images
  updateBanner
);

module.exports = bannerRoute;
