const express = require("express");
const passport = require("passport");
const bcrypt = require("bcrypt");
const _ = require("lodash");
const mongoose = require("mongoose");
const Joi = require("joi");
const debug = require("debug")("development");
const passwordComplexity = require("joi-password-complexity");
const { User, validate: validateUser } = require("../models/user");

const router = express.Router();

function validate(req) {
  const schema = {
    email: Joi.string().min(5).max(255).required(),
    password: Joi.string().min(5).max(1024).required(),
  };
  const result = Joi.validate(req, schema);
  return result;
}

router.get(
  "/login/github",
  passport.authenticate("github", { scope: ["email"] })
);

router.get(
  "/github/return",
  passport.authenticate("github", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("/profile");
  }
);

router.get(
  "/login/facebook",
  passport.authenticate("facebook", { scope: ["email"] })
);

router.get(
  "/facebook/return",
  passport.authenticate("facebook", { failureRedirect: "/" }),
  async (req, res) => {
    res.redirect("/");
  }
);

router.get(
  "/login/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/return",
  passport.authenticate("google", { failureRedirect: "/" }),
  async (req, res) => {
    res.redirect("/");
  }
);

router.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

router.post("/register", async (req, res, next) => {
  let err = null;
  if (
    !(
      req.body.email &&
      req.body.name &&
      req.body.birthDate &&
      req.body.password &&
      req.body.confirmPassword
    )
  ) {
    err = new Error("All fields required.");
    err.status = 400;
    return next(err);
  }
  // confirm that user typed same password twice
  if (req.body.password !== req.body.confirmPassword) {
    err = new Error("Passwords do not match.");
    err.status = 400;
    return next(err);
  }

  passwordComplexity().validate(req.body.password);

  const { error } = validateUser(
    _.pick(req.body, ["email", "name", "password", "birthDate"])
  );

  if (error) throw new Error(result.error.details[0].message);

  let user = await User.findOne({ email: req.body.email });
  if (user) throw new Error("User already registered");

  // create object with form input
  user = {
    email: req.body.email,
    name: req.body.name,
    birthDate: req.body.birthDate,
    password: req.body.password,
  };

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);

  // use schema's `create` method to insert document into Mongo
  User.create(user, function (err, user) {
    if (err) {
      return next(err);
    }
    req.session.passport = { user: user._id };
    return res.redirect("/profile");
  });
});

// sign in
router.post("/login", async (req, res, next) => {
  let err = null;
  const { error } = validate(req.body);
  if (error) throw new Error(result.error.details[0].message);

  const user = await User.findOne({ email: req.body.email });
  if (!user || !user.password) {
    err = new Error("Invalid email or password.");
    err.status = 400;
    return next(err);
  }

  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword) {
    err = new Error("Invalid email or password.");
    err.status = 400;
    return next(err);
  }
  req.session.passport = { user: user._id };
  return res.redirect("/profile");
});

module.exports = router;
