const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const { APP_PORT, DB_URL, SESSIONSECRET } = require("./config");
const mongoose = require("mongoose");
const passport = require("passport");
const axios = require("axios");
const http = require("http");
const server = http.createServer(app);
const User = require("./models/userModel");
const cron = require("node-cron");


const { v4: uuidv4 } = require("uuid"); // For generating unique IDs
const session = require("express-session");
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(passport.initialize());
app.use("/public", express.static("public"));

app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

app.use(passport.session())


require("./middleware/passport")(passport);
require('./middleware/authenticate');
app.get("/ping", (req, res) => {
  res.send("PONG");
});
app.get("/", (req, res) => {
  res.send("hiiiiiiiii from the server");
});
const user_routes = require("./routes/userRoute");

const bannerRoute = require("./routes/bannerRoutes");
const e = require("express");


//user_routes
app.use("/", user_routes);

app.use("/", bannerRoute);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
})









//   server connection
server.listen(APP_PORT, () => {
  console.log(`Server is running on port ${APP_PORT}`);
});
//   databse connection
mongoose
  .connect(DB_URL, {})
  .then(() => {
    console.log("DB connected...");
  })
  .catch((err) => {
    console.error("DB connection error:", err);
  });
