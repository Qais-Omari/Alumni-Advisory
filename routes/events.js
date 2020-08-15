const debug = require("debug")("development");
const express = require("express");
const { Error } = require("mongoose");
const mongoose = require("mongoose");
const { ObjectID } = require("mongodb");
const _ = require("lodash");
const { Event, validate: validateEvent } = require("../models/event");
const { requiresLogin } = require("../middleware");
const admin = require("../middleware/admin");
const formatDate = require("../utils/dates");

const router = express.Router();

router.get("/", async (req, res) => {
  const events = await Event.find()
    .select("_id title date address description")
    .sort("-date")
    .lean()
    .exec();

  events.forEach((event) => {
    event.date = formatDate(event.date);
    event.description = event.description.substr(0, 100);
  });

  return res.render("events", { title: "Events List", events });
});

router.get("/details/:id", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id))
    throw new Error("Event is not valid!");

  const event = await Event.findById(req.params.id).lean().exec();
  if (!event) throw new Error("Event is not found!");

  event.date = formatDate(event.date);
  event.coordinates = event.coordinates
    .slice(1, event.coordinates.length - 1)
    .split(",");
  event.coordinates[0] = parseFloat(event.coordinates[0]);
  event.coordinates[1] = parseFloat(event.coordinates[1]);
  // debug(event);
  return res.render("event", {
    title: "View Event",
    event: event,
    readonlyInputs: true,
  });
});

router.get("/form", [requiresLogin, admin], async (req, res) => {
  return res.render("event", {
    title: "Create Event",
    readonlyInputs: false,
  });
});

router.get("/edit/:id", [requiresLogin, admin], async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id))
    throw new Error("Event is not valid!");

  const event = await Event.findById(req.params.id).lean().exec();
  if (!event) throw new Error("Event is not found!");

  event.date = formatDate(event.date);
  event.coordinates = event.coordinates
    .slice(1, event.coordinates.length - 1)
    .split(",");
  event.coordinates[0] = parseFloat(event.coordinates[0]);
  event.coordinates[1] = parseFloat(event.coordinates[1]);
  // debug(event);
  return res.render("event", {
    title: "Edit Event",
    event: event,
    readonlyInputs: false,
  });
});

router.post("/delete/", [requiresLogin, admin], async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.body.id))
    throw new Error("Event is not found!");

  const event = await Event.findById(req.body.id);
  if (!event) throw new Error("Post is not found!");

  await Event.findByIdAndDelete(req.body.id);

  res.redirect("/events");
});

router.post("/", [requiresLogin, admin], async (req, res) => {
  const event = _.pick(req.body, [
    "title",
    "description",
    "coordinates",
    "address",
    "date",
  ]);
  const { error } = validateEvent(event);
  if (error) throw new Error(result.error.details[0].message);

  const eventObj = await Event.findByIdAndUpdate(
    req.body.id || new ObjectID(),
    event,
    {
      new: true,
      upsert: true,
    }
  );

  res.redirect(`/events/edit/${eventObj._id}`);
});

module.exports = router;
