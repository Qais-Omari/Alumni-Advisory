const config = require("config");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const mongoose = require("mongoose");
const _ = require("lodash");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
    minlength: 8,
    maxlength: 30,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    minlength: 8,
    maxlength: 30,
    trim: true,
  },
  password: {
    type: String,
    minlength: 5,
    maxlength: 1024,
    trim: true,
  },
  birthDate: { type: Date },
  photo: { type: String, trim: true },
  bio: { type: String, maxlength: 180, trim: true },
  phone: { type: String, minlength: 9, maxlength: 20, trim: true },
  address: { type: String, minlength: 7, maxlength: 50, trim: true },
  linkedIn: { type: String, minlength: 25, maxlength: 100, trim: true },
  isAdmin: { type: Boolean, default: false },
});

userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    _.pick(this, ["_id", "isAdmin"]),
    config.get("jwtPrivateKey")
  );
  return token;
};

const User = mongoose.model("User", userSchema);

function validateUser(user) {
  const schema = {
    email: Joi.string().min(8).max(30).required(),
    // .email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } }),
    name: Joi.string().min(8).max(30).required(),
    password: Joi.string().min(5).max(1024),
    birthDate: Joi.date().less(new Date("2004-1-1")),
    photo: Joi.string(),
    bio: Joi.string().max(180).allow(""),
    phone: Joi.string().min(9).max(20).allow(""),
    address: Joi.string().min(7).max(50).allow(""),
    linkedIn: Joi.string().min(25).max(100).allow(""),
    isAdmin: Joi.boolean(),
  };
  const result = Joi.validate(user, schema);
  return result;
}

exports.User = User;
exports.validate = validateUser;
