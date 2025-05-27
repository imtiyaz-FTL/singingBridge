// middleware/userActivity.js
const userController = require('../controllers/auth/userController');

module.exports = async (req, res, next) => {
  if (!req.session.username) {
    req.session.username = 'user' + Math.floor(Math.random() * 1000);
  }
// console.log("kakakkakakk")
  const username = req.session.username;
  await userController.updateUserActivity(username);

  next();
};