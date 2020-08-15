const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
const debug = require("debug")("development");
const { User } = require("../models/user");

module.exports = function (app, db) {
  app.use(
    session({
      secret: "session secret key",
      resave: true,
      saveUninitialized: false,
      store: new MongoStore({
        mongooseConnection: db,
      }),
    })
  );

  app.use(async (req, res, next) => {
    if (req.session.passport) {
      const user = await User.findById(req.session.passport.user).select(
        "_id photo isAdmin"
      );
      res.locals.currentUser = user;
    }
    next();
  });
};
