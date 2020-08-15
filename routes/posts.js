const debug = require("debug")("development");
const express = require("express");
const _ = require("lodash");
const { Error } = require("mongoose");
const mongoose = require("mongoose");
const fs = require("fs");
const { promisify } = require("util");
const { Post, validate } = require("../models/post");
const { requiresLogin } = require("../middleware");
const formatDate = require("../utils/dates");
const upload = require("../middleware/imgFilter")();

const unlinkAsync = promisify(fs.unlink);
const router = express.Router();

router.get("/", async (req, res) => {
  const { pageNumber } = req.query;
  const pageSize = 6;

  const posts = await Post.find()
    .sort({ publishDate: -1 })
    .skip((pageNumber - 1) * pageSize)
    .limit(pageSize)
    .lean()
    .exec();

  posts.forEach((post) => {
    post.publishDate = formatDate(post.publishDate);
    post.content = post.content.substr(0, 200);
  });

  let morePosts = false;
  if (posts.length == pageSize) morePosts = true;

  return res.render("forum", {
    title: "Forum",
    posts: posts,
    pageNumber: pageNumber,
    morePosts,
  });
});

router.get("/form", async (req, res) => {
  return res.render("forumForm", { title: "Post form" });
});

router.post("/comment", requiresLogin, async (req, res) => {
  const comment = { content: req.body.comment, author: req.user._id };
  const post = await Post.findByIdAndUpdate(req.body.postId, {
    $push: { comments: comment },
  });
  // debug(post);
  return res.redirect(`/posts/${post._id}`);
});

router.get("/:id", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id))
    throw new Error("Post is not valid!");

  const post = await Post.findById(req.params.id)
    .populate("comments.author", "name")
    .lean()
    .exec();
  if (!post) throw new Error("Post is not found!");

  post.comments.forEach((comment) => {
    comment.timestamp = formatDate(comment.timestamp);
  });

  let userName = "";

  if (req.user) userName = req.user.name;

  return res.render("post", {
    title: post.title,
    publishDate: formatDate(post.publishDate),
    noOfComments: post.comments.length,
    content: post.content,
    photo: post.photo,
    name: userName,
    postId: post._id,
    comments: post.comments,
    author: post.author.name,
  });
});

router.post("/", [requiresLogin, upload.single("photo")], async (req, res) => {
  if (req.file) {
    req.body.photo = req.file.path;
  }
  req.body.author = {
    id: req.session.passport.user,
    name: req.user.name,
  };
  const { error } = validate(req.body);

  if (error) throw new Error(result.error.details[0].message);
  const post = new Post(
    _.pick(req.body, ["title", "content", "photo", "author"])
  );

  await post.save();
  return res.redirect(`/posts/${post._id}`);
});

router.get("/edit/:id", requiresLogin, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id))
    throw new Error("Post is not valid!");
  // debug(req.params.id);
  const post = await Post.findById(req.params.id).select(
    "title content author"
  );
  // debug(post);
  return res.render("forumForm", {
    title: "Edit Post",
    post,
  });
});

router.post(
  "/update",
  [requiresLogin, upload.single("photo")],
  async (req, res) => {
    if (req.file) {
      req.body.photo = req.file.path;
    }
    req.body.author = {
      id: req.session.passport.user,
      name: req.user.name,
    };

    if (req.body.authorId != req.user._id)
      throw new Error("You're not allowed to update this post.");

    const { error } = validate(
      _.pick(req.body, ["title", "content", "author"])
    );
    if (error) throw new Error(result.error.details[0].message);

    const post = await Post.findByIdAndUpdate(req.body.postId, req.body);
    if (!post) throw new Error("This post doesn't exist!");

    res.redirect(`/profile/posts/${req.user._id}`);
  }
);

router.post("/delete", requiresLogin, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.body.id))
    throw new Error("Post is not valid!");

  let post = await Post.findById(req.body.id);
  if (!post) throw new Error("Post is not found!");

  if (post.author.id != req.session.passport.user)
    throw new Error("You're not allowed to delete this post.");

  post = await Post.findByIdAndDelete(req.body.id);
  await unlinkAsync(post.photo);
  res.redirect("/profile");
});

module.exports = router;
