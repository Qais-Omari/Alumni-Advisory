const Joi = require("joi");
const mongoose = require("mongoose");

const mentorshipSchema = new mongoose.Schema({
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  domain: { type: String },
  duration: { type: String, required: true },
  startDate: { type: Date },
  endDate: { type: Date },
  availability: { type: String },
  target: {
    type: String,
    lowercase: true,
    enum: ["fresh students", "senior students", "fresh graduates"],
  },
  strategy: { type: String, trim: true, minlength: 100 },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
  capacity: {
    type: Number,
    max: 5,
    min: 1,
  },
});

const Mentorship = mongoose.model("Mentorship", mentorshipSchema);

function validateMentorship(mentorship) {
  const schema = {
    mentor: Joi.objectId(),
    domain: Joi.string(),
    duration: Joi.string().required(),
    startDate: Joi.date().greater("now"),
    endDate: Joi.date().greater(Joi.ref("startDate")),
    availability: Joi.string(),
    target: Joi.string(),
    strategy: Joi.string().min(100),
    status: Joi.string(),
    capacity: Joi.number(),
  };
  const result = Joi.validate(mentorship, schema);
  return result;
}

function getDuration(duration) {
  switch (duration) {
    case "6 months":
      return 6;
    case "3 months":
      return 3;
    default:
      return 1;
  }
}

exports.Mentorship = Mentorship;
exports.validate = validateMentorship;
exports.getDuration = getDuration;
