const Joi = require("joi");
const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 50,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    minlength: 100,
    trim: true,
  },
  coordinates: {
    type: String,
    validate: {
      validator: function (v) {
        return /^\(-?\d+\.?\d*,\s+-?\d+\.?\d*\)$/.test(v);
      },
      message: (props) => `${props.value} are not a validmap coordinates!`,
    },
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  address: {
    type: String,
    required: true,
    min: 7,
    max: 50,
  },
});

const Event = mongoose.model("Event", eventSchema);

function validateEvent(event) {
  const schema = {
    title: Joi.string().required().min(5).max(50),
    description: Joi.string().required().min(100),
    coordinates: Joi.string()
      .regex(new RegExp(/^\(-?\d+\.?\d*,\s+-?\d+\.?\d*\)$/))
      .error((errors) => {
        errors.forEach((err) => {
          err.message = "Bad Coordinates!";
        });
        return errors;
      })
      .required(),
    date: Joi.date().greater("now").required(),
    address: Joi.string().min(7).max(50).trim().required(),
  };
  const result = Joi.validate(event, schema);
  return result;
}

exports.Event = Event;
exports.validate = validateEvent;
