const config = require("config");
const debug = require("debug")("development");
const passport = require("passport");
const GitHubStrategy = require("passport-github");
const FacebookStrategy = require("passport-facebook");
const GoogleStrategy = require("passport-google-oauth20");
const { User } = require("../models/user");

async function generateOrFindUser(accessToken, refreshToken, profile, done) {
  if (!profile.emails) {
    const noEmailError = new Error(
      "Your email privacy settings prevent you from signing into Alumni Advisory."
    );
    noEmailError.status = 403;
    return done(noEmailError, null);
  }
  let user = await User.findOne({ email: profile.emails[0].value });

  if (!user) {
    // debug(profile.emails[0].value);
    user = new User({
      email: profile.emails[0].value,
      name: profile.displayName,
      photo: profile.photos[0].value,
      isAdmin: false,
    });
    await user.save();
  }
  return done(null, user);
}

module.exports = function (app) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: config.get("GITHUB_CLIENT_ID"),
        clientSecret: config.get("GITHUB_CLIENT_SECRET"),
        callbackURL: "http://localhost:3000/api/auth/github/return",
      },
      generateOrFindUser
    )
  );

  passport.use(
    new FacebookStrategy(
      {
        clientID: config.get("FACEBOOK_APP_ID"),
        clientSecret: config.get("FACEBOOK_APP_SECRET"),
        callbackURL: "http://localhost:3000/api/auth/facebook/return",
        profileFields: ["id", "displayName", "photos", "email"],
      },
      generateOrFindUser
    )
  );

  passport.use(
    new GoogleStrategy(
      {
        clientID: config.get("GOOGLE_CLIENT_ID"),
        clientSecret: config.get("GOOGLE_CLIENT_SECRET"),
        callbackURL: "http://localhost:3000/api/auth/google/return",
        profileFields: ["id", "displayName", "photos", "email"],
      },
      generateOrFindUser
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user._id);
  });
  passport.deserializeUser((userId, done) => {
    User.findById(userId, (err, user) => {
      done(err, user);
    });
  });
  app.use(passport.initialize());
  app.use(passport.session());
};
