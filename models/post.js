const Joi = require("joi");
const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 50,
    trim: true,
  },
  content: {
    type: String,
    required: true,
    minlength: 100,
    trim: true,
  },
  photo: { type: String, trim: true },
  publishDate: { type: Date, default: Date.now },
  author: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    name: {
      type: String,
      required: true,
    },
  },
  comments: [
    {
      content: { type: String, trim: true, maxlength: 280, required: true },
      timestamp: { type: Date, default: Date.now },
      author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
  ],
});

const Post = mongoose.model("Post", postSchema);

function validatePost(post) {
  const schema = {
    title: Joi.string().required().min(5).max(50),
    content: Joi.string().required().min(100),
    photo: Joi.string().allow(""),
    publishDate: Joi.date().allow(null),
    author: Joi.object({
      id: Joi.objectId(),
      name: Joi.string(),
    }).required(),
    comments: Joi.array()
      .items(
        Joi.object({
          author: Joi.objectId().required(),
          content: Joi.string().max(280).required(),
          timestamp: Joi.date().default(new Date()),
        })
      )
      .optional(),
  };
  const result = Joi.validate(post, schema);
  return result;
}

exports.Post = Post;
exports.validate = validatePost;
