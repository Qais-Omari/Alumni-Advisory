const Joi = require("joi");
const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
  mentorship: { type: mongoose.Schema.Types.ObjectId, ref: "Mentorship" },
  requester: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  requestDate: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["pending", "rejected", "approved"],
    default: "pending",
  },
});

const Request = mongoose.model("Request", requestSchema);

function validateRequest(request) {
  const schema = {
    mentorship: Joi.objectId(),
    requester: Joi.objectId(),
    requestDate: Joi.date(),
    status: Joi.string(),
  };
  const result = Joi.validate(request, schema);
  return result;
}

exports.Request = Request;
exports.validate = validateRequest;
