const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const { APP_PORT, DB_URL, SESSIONSECRET } = require("./config");
const mongoose = require("mongoose");
const passport = require("passport");
const axios = require("axios");
const http = require("http");
const socketIo = require("socket.io");
const server = http.createServer(app);
const User = require("./models/userModel");
const cron = require("node-cron");
const { v4: uuidv4 } = require("uuid"); // For generating unique IDs
const session = require("express-session");
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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

const io = socketIo(server, {
  cors: { origin: "*" }
});

//user_routes
app.use("/", user_routes);

app.use("/", bannerRoute);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
})


// In-memory map to track online users: userId -> socketId
const onlineUsers = new Map(); // Map<userId, Set<socketId>>


io.on("connection", (socket) => {
  console.log("New socket connected:", socket.id);

socket.on("user-online", async ({ userId }) => {
  // Add socket ID to the user's Set
  if (onlineUsers.has(userId)) {
    onlineUsers.get(userId).add(socket.id);
  } else {
    onlineUsers.set(userId, new Set([socket.id]));

    // Only update DB when first tab connects
    await User.findByIdAndUpdate(userId, {
      online: true,
      lastActivity: new Date(),
    });
  }

  // Get all online users (excluding this user if needed)
  let onlineUserData = await User.aggregate([
    { $match: { online: true } },
    {
      $project: {
        userId: "$_id",
        _id: 0,
        name: 1,
        profilePic: 1,
        online: 1,
        lastActivity: 1,
      },
    },
  ]);

  // Optional: Exclude this user
  onlineUserData = onlineUserData.filter(u => String(u.userId) !== String(userId));

  io.emit("update-online-users", onlineUserData);
});





socket.on("disconnect", async () => {
  for (const [userId, socketSet] of onlineUsers.entries()) {
    socketSet.delete(socket.id);

    if (socketSet.size === 0) {
      // All tabs/devices disconnected
      onlineUsers.delete(userId);

      await User.findByIdAndUpdate(userId, {
        online: false,
        lastActivity: new Date(),
      });

      // Broadcast updated list
      const onlineUserData = await User.aggregate([
        { $match: { online: true } },
        {
          $project: {
            userId: "$_id",
            _id: 0,
            name: 1,
            profilePic: 1,
            online: 1,
            lastActivity: 1,
          },
        },
      ]);

      io.emit("update-online-users", onlineUserData);
    }

    break; // Only one user can have this socket.id
  }
});

});








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
