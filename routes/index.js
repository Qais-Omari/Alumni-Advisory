const debug = require("debug")("development");
const express = require("express");
const { Event } = require("../models/event");
const { loggedOut, requiresLogin } = require("../middleware");
const formatDate = require("../utils/dates");

const router = express.Router();

router.get("/logout", requiresLogin, async (req, res) => {
  if (req.session) {
    await req.session.destroy();
  }
  return res.redirect("/");
});

router.get("/login", loggedOut, (req, res) => {
  return res.render("login", { title: "Log In" });
});

router.get("/register", loggedOut, (req, res) => {
  res.render("register", { title: "Register" });
});

// GET /
router.get("/", async (req, res) => {
  const events = await Event.find()
    .select("_id title date")
    .sort("-date")
    .limit(3)
    .lean()
    .exec();

  events.forEach((event) => {
    event.date = formatDate(event.date);
  });
  return res.render("index", { title: "Home", events: events });
});

router.get("/messenger", requiresLogin, function (req, res) {
  return res.render("messenger", { title: "Messenger" });
});

router.get("/chat", requiresLogin, function (req, res) {
  return res.render("chat", { title: "Chat" });
});

module.exports = router;
