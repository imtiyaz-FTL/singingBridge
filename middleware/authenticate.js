var passport = require('passport');
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = require("../config");
var GoogleStrategy = require('passport-google-oauth20').Strategy;
passport.serializeUser((user, done) => {
  done(null, user); // Store the entire user object
});
passport.deserializeUser((user, done) => {
  done(null, user); // Retrieve the entire user object
});
passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: "https://chess.dynamochess.in/auth/google/callback",
  scope: ["profile", "email"]
}, function (accessToken, refreshToken, profile, callback) {
  callback(null, profile);
}));