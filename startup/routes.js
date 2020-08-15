const express = require("express");
const favicon = require("serve-favicon");
const path = require("path");
const debug = require("debug")("development");
const posts = require("../routes/posts");
const profiles = require("../routes/profiles");
const mentorships = require("../routes/mentorships");
const requests = require("../routes/requests");
const events = require("../routes/events");
const index = require("../routes/index");
const auth = require("../routes/auth");
const error = require("../middleware/error");

const appDir = path.dirname(require.main.filename);

module.exports = function (app) {
  app.set("view engine", "pug");
  app.set("views", "./views");
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(appDir, "public")));
  app.use(express.static(path.join(appDir, "uploads")));
  app.use(favicon(path.join(appDir, "public", "images", "elearning.ico")));
  app.use("/posts", posts);
  app.use("/api/auth", auth);
  app.use("/profile", profiles);
  app.use("/mentorship", mentorships);
  app.use("/request", requests);
  app.use("/events", events);
  app.use("/", index);

  // catch 404 and forward to error handler
  app.use(function (req, res, next) {
    const err = new Error("File Not Found");
    err.status = 404;
    next(err);
  });

  // error handler
  // define as the last app.use callback
  app.use(error);
};
