const debug = require("debug")("development");
const express = require("express");
const mongoose = require("mongoose");
const {
  Mentorship,
  validate: validateMentorship,
} = require("../models/mentorship");
const { Request } = require("../models/request");
const { requiresLogin } = require("../middleware");
const formatDate = require("../utils/dates");

const router = express.Router();

router.get("/", async (req, res) => {
  let availableMentors = false;
  let availableRequests = false;
  let amIMentor = false;
  let mentorship = null;

  if (req.user) {
    const myMentorship = await Mentorship.findOne({
      mentor: req.user._id,
      status: "active",
    });

    if (myMentorship) amIMentor = true;

    mentorship = await Mentorship.findOne({
      mentor: { $ne: req.user._id },
      status: "active",
    });

    if (mentorship) {
      const requests = await Request.find({
        requester: req.user._id,
        status: { $in: ["approved", "pending", "rejected"] },
      })
        .sort("status")
        .populate({
          path: "mentorship",
          match: { status: "active", endDate: { $gte: new Date() } },
        });

      let validReqsCounter = 0;

      requests.forEach((request) => {
        if (request.mentorship) {
          validReqsCounter += 1;
        }
      });

      if (requests.length != 0 && validReqsCounter != 0) {
        availableRequests = true;
      }
    }
  } else {
    mentorship = await Mentorship.findOne();
  }

  if (mentorship) availableMentors = true;

  return res.render("mentorship", {
    title: "Mentorship",
    availableMentors,
    availableRequests,
    amIMentor,
  });
});

router.get("/mentorPage", requiresLogin, async (req, res) => {
  const mentorship = await Mentorship.findOne({
    mentor: req.user._id,
    status: "active",
    endDate: { $gt: new Date() },
  })
    .lean()
    .exec();
  if (!mentorship) throw new Error("You haven't applied to be a mentor yet!");

  mentorship.startDate = formatDate(mentorship.startDate);
  mentorship.endDate = formatDate(mentorship.endDate);

  let requests = await Request.find({
    mentorship: mentorship._id,
    status: "approved",
  })
    .lean()
    .exec();

  if (requests) {
    mentorship.mentees = requests.length;
  } else mentorship.mentees = 0;

  requests = await Request.find({
    mentorship: mentorship._id,
    status: "pending",
  })
    .populate("requester", "name")
    .lean()
    .exec();

  requests.forEach((request) => {
    request.requestDate = formatDate(request.requestDate);
  });

  const mentees = await Request.find({
    mentorship: mentorship._id,
    status: "approved",
  })
    .sort("requestDate")
    .populate("requester", "name")
    .populate({
      path: "mentorship",
      populate: {
        path: "mentor",
        model: "User",
        select: "name",
      },
    });

  // debug(mentees);
  return res.render("mentorPage", {
    title: "Mentor Homepage",
    mentorship: mentorship,
    requests: requests,
    mentees: mentees,
  });
});

router.get("/menteePage", requiresLogin, async (req, res) => {
  const requests = await Request.find({
    requester: req.user._id,
    status: { $in: ["approved", "pending", "rejected"] },
  })
    .sort("status")
    .populate({
      path: "mentorship",
      populate: {
        path: "mentor",
        model: "User",
        select: "name",
      },
      match: { status: "active", endDate: { $gte: new Date() } },
    })
    .lean()
    .exec();

  let validReqsCounter = 0;

  requests.forEach((request) => {
    if (request.mentorship) {
      validReqsCounter += 1;
      request.mentorship.startDate = formatDate(request.mentorship.startDate);
      request.mentorship.endDate = formatDate(request.mentorship.endDate);
    }
  });

  if (requests.length == 0 || validReqsCounter == 0)
    throw new Error(
      "You did't send request to mentors or your requests are rejected!"
    );

  const mentors = await Request.find({
    requester: req.user._id,
    status: "approved",
  })
    .sort("requestDate")
    .populate({
      path: "mentorship",
      populate: {
        path: "mentor",
        model: "User",
        select: "name",
      },
      match: { status: "active", endDate: { $gte: new Date() } },
    });
  // debug(mentors);
  return res.render("menteePage", {
    title: "Mentee Homepage",
    requests: requests,
    mentors: mentors,
  });
});

router.get("/mentorForm", requiresLogin, async (req, res) => {
  const mentorship = await Mentorship.findOne({
    mentor: req.user._id,
    status: "active",
  })
    .lean()
    .exec();

  if (mentorship) {
    mentorship.startDate = formatDate(mentorship.startDate);
    mentorship.endDate = formatDate(mentorship.endDate);
    return res.render("mentorForm", {
      title: "Mentorship Application",
      mentorship,
    });
  }
  return res.render("mentorForm", {
    title: "Mentorship Application",
  });
});

router.get("/mentorsList", requiresLogin, async (req, res) => {
  const mentorships = await Mentorship.find({
    mentor: { $ne: req.user._id },
    status: "active",
    startDate: { $gt: new Date() },
  })
    .populate("mentor", "name")
    .lean()
    .exec();

  if (mentorships.length == 0) throw new Error("No available Mentors yet!");

  await Promise.all(
    mentorships.map((mentorship) => {
      return Request.find({
        entorship: mentorship._id,
        status: "approved",
      }).then((requests) => {
        if (requests) mentorship.mentees = requests.length;
        else mentorship.mentees = 0;

        mentorship.startDate = formatDate(mentorship.startDate);
        mentorship.endDate = formatDate(mentorship.endDate);
        return requests;
      });
    })
  );

  await Promise.all(
    mentorships.map((mentorship) => {
      return Request.find({
        mentorship: mentorship._id,
        requester: req.user._id,
      }).then((requests) => {
        if (requests.length != 0) mentorship.sentRequest = true;
        return requests;
      });
    })
  );

  return res.render("mentorsList", {
    title: "Available Mentors",
    mentorships: mentorships,
  });
});

router.post("/apply", requiresLogin, async (req, res) => {
  const mentorship = {
    mentor: req.session.passport.user,
    domain: req.body.domain,
    duration: req.body.duration,
    availability: req.body.availability,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    target: req.body.target,
    strategy: req.body.strategy,
    capacity: req.body.capacity,
  };

  const { error } = validateMentorship(mentorship);
  if (error) throw new Error(result.error.details[0].message);

  if (
    await Mentorship.findOne({
      mentor: req.user._id,
      status: { $ne: "inactive" },
    })
  )
    throw new mongoose.Error("A mentorship program is already created!");
  else await Mentorship.create(mentorship);

  res.redirect("/mentorship");
});

router.post("/cancel", requiresLogin, async (req, res) => {
  let outdatedMentorship = false;

  let mentorship = await Mentorship.findOne({
    mentor: req.user._id,
    endDate: { $lt: new Date() },
    status: "active",
  });

  if (mentorship) outdatedMentorship = true;

  mentorship = await Mentorship.findOne({
    mentor: req.user._id,
    status: "active",
  });

  let requests = [];

  if (mentorship) {
    requests = await Request.find({
      mentorship: mentorship._id,
      status: "approved",
    });
  }

  if (outdatedMentorship || requests.length == 0) {
    await Mentorship.findByIdAndUpdate(mentorship._id, {
      $set: { status: "inactive" },
    });
    await Request.updateOne(
      { mentorship: mentorship._id, status: "pending" },
      { status: "rejected" }
    );
  } else {
    throw new mongoose.Error(
      "You can't cancel an active menorship which have mentees!"
    );
  }

  res.redirect("/mentorship");
});

router.get("/check", requiresLogin, async (req, res) => {
  let outdatedMentorship = false;

  let mentorship = await Mentorship.findOne({
    mentor: req.user._id,
    endDate: { $lt: new Date() },
    status: "active",
  });
  // debug(mentorship);
  if (mentorship) outdatedMentorship = true;

  mentorship = await Mentorship.findOne({
    mentor: req.user._id,
    status: "active",
  });
  // debug(mentorship);
  let requests = [];

  if (mentorship) {
    requests = await Request.find({
      mentorship: mentorship._id,
      status: "approved",
    });
    // debug(requests.length);
  }
  // debug(requests.length);
  if (outdatedMentorship || requests.length == 0) {
    res.status(200).send("true");
  } else {
    throw new mongoose.Error(
      "You can't cancel an active menorship which have mentees!"
    );
  }
});

module.exports = router;
