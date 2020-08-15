const debug = require("debug")("development");
const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");
const { Mentorship } = require("../models/mentorship");
const { Request } = require("../models/request");
const { requiresLogin } = require("../middleware");
const { User } = require("../models/user");
const { transporter, getMailOptions } = require("../middleware/email");

const router = express.Router();

router.post("/", requiresLogin, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.body.id))
    throw new Error("Invalid request.");

  const mentorship = await Mentorship.findById(req.body.id).select(
    "capacity mentor"
  );

  if (!mentorship) throw new Error("Mentorship is not available!");

  if (mentorship.mentor == req.session.passport.user)
    throw new Error("You can't be a mentee of your own mentorship program!");

  const requests = await Request.find({
    mentorship: mentorship._id,
    status: "approved",
  });

  if (requests)
    if (mentorship.capacity === requests.length)
      throw new Error("Mentorship has reached its maximum capacity!");

  const request = await Request.findOne({
    mentorship: mentorship._id,
    requester: req.user._id,
  });
  // debug(request);
  if (request) throw new Error("You've already sent a request!");

  await Request.create({ mentorship: mentorship._id, requester: req.user._id });

  const recipient = await User.findById(mentorship.mentor).select("name email");
  transporter.sendMail(
    getMailOptions(
      recipient.email,
      "New Mentorship Request",
      `${recipient.name} has sent you a request to be his Mentor!`
    ),
    function (err) {
      if (err) debug(err);
      else debug("email is sent");
    }
  );
  // debug(recipient);
  res.redirect("/mentorship/menteePage");
});

router.post("/reject", requiresLogin, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.body.id))
    throw new Error("Invalid request.");

  const request = await Request.findOneAndUpdate(
    { _id: req.body.id, status: "pending" },
    {
      status: "rejected",
    }
  ).populate("mentorship", "mentor");

  if (!request) throw new Error("You already have rejected this request!");
  else {
    if (request.mentorship.mentor != req.session.passport.user)
      throw new Error("Not allowed!");

    const recipient = await User.findById(request.requester).select(
      "name email"
    );
    transporter.sendMail(
      getMailOptions(
        recipient.email,
        "Your Mentorship Request is rejected!",
        `${recipient.name} has just rejected your request to be your Mentor!`
      ),
      function (err) {
        if (err) debug(err);
        else debug("email is sent");
      }
    );
  }
  res.redirect("/mentorship/mentorPage");
});

router.post("/approve", requiresLogin, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.body.id))
    throw new Error("Invalid request.");

  const request = await Request.findOneAndUpdate(
    { _id: req.body.id, status: "pending" },
    {
      status: "approved",
      startDate: Date.now(),
    }
  ).populate("mentorship", "mentor");
  // debug(request);
  if (!request) throw new Error("You already have approved this request!");
  else {
    if (request.mentorship.mentor != req.session.passport.user)
      throw new Error("Not allowed!");

    const recipient = await User.findById(request.requester).select(
      "name email"
    );
    debug(recipient);
    transporter.sendMail(
      getMailOptions(
        recipient.email,
        "Your Mentorship Request is approved!",
        `${recipient.name} has just approved your request to be your Mentor!`
      ),
      function (err) {
        if (err) debug(err);
        else debug("email is sent");
      }
    );
  }
  res.redirect("/mentorship/mentorPage");
});

router.post("/revoke", requiresLogin, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.body.id))
    throw new Error("Invalid request.");

  const request = await Request.findOne({
    _id: req.body.id,
    status: { $in: ["pending", "rejected"] },
  }).populate({ path: "mentorship" });

  if (request.requester != req.session.passport.user)
    throw new Error("Not allowed!");

  if (!request)
    throw new Error(
      "There's no request to be deleted or you can't delete an approved request!"
    );
  else {
    await Request.deleteOne({ _id: req.body.id });

    const recipient = await User.findById(request.mentorship.mentor).select(
      "name email"
    );
    transporter.sendMail(
      getMailOptions(
        recipient.email,
        "A Mentorship Request is revoked!",
        `${recipient.name} has revoked the request to be your Mentee!`
      ),
      function (err) {
        if (err) debug(err);
        else debug("email is sent");
      }
    );
  }
  res.redirect("/mentorship/");
});

module.exports = router;
