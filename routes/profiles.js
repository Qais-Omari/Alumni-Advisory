const debug = require("debug")("development");
const express = require("express");
const _ = require("lodash");
const mongoose = require("mongoose");
const { Error } = require("mongoose");
const fs = require("fs");
const { promisify } = require("util");
const upload = require("../middleware/imgFilter")();
const { User, validate } = require("../models/user");
const { Post } = require("../models/post");
const { requiresLogin } = require("../middleware");
const admin = require("../middleware/admin");
const formatDate = require("../utils/dates");

const unlinkAsync = promisify(fs.unlink);
const router = express.Router();

router.get("/members", [requiresLogin, admin], async (req, res) => {
  const users = await User.find({ isAdmin: false }).select(
    "_id name email phone address"
  );

  if (!users) throw new Error("There're no members");
  return res.render("members", {
    title: "Members List",
    users,
  });
});

router.get("/edit", requiresLogin, async (req, res) => {
  return res.render("editProfile", {
    title: "Edit Profile",
    name: req.user.name,
    email: req.user.email,
    birthDate: formatDate(req.user.birthDate),
    photo: req.user.photo,
    phone: req.user.phone || "",
    bio: req.user.bio || "",
    address: req.user.address || "",
    linkedIn: req.user.linkedIn || "",
  });
});

router.get("/view/:id", [requiresLogin, admin], async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id))
    throw new Error("Invalid user.");

  const user = await User.findById(req.params.id);

  if (!user) throw new Error("User is not found!");

  return res.render("editProfile", {
    title: "View Profile",
    name: user.name,
    email: user.email,
    birthDate: formatDate(user.birthDate),
    photo: user.photo,
    phone: user.phone || "",
    bio: user.bio || "",
    address: user.address || "",
    linkedIn: user.linkedIn || "",
    hideBtn: true,
  });
});

router.get("/", requiresLogin, async (req, res) => {
  // debug(req.session.passport);
  const user = await User.findById(req.user._id);

  const post = await Post.findOne({ "author.id": req.user._id }).select(
    "title"
  );
  let postsExist = false;
  if (post) postsExist = true;

  return res.render("profile", {
    title: "Profile",
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    photo: req.user.photo,
    phone: user.phone || "",
    address: user.address || "",
    bio: user.bio || "",
    linkedIn: user.linkedIn || "",
    postsExist: postsExist,
  });
});

router.get("/:id", requiresLogin, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id))
    throw new Error("Invalid user.");

  const user = await User.findById(req.params.id);

  if (!user) throw new Error("User is not found!");

  return res.render("profile", {
    title: "Profile",
    id: user._id,
    name: user.name,
    email: user.email,
    photo: user.photo,
    phone: user.phone || "",
    address: user.address || "",
    bio: user.bio || "",
    linkedIn: user.linkedIn || "",
    view: true,
  });
});

router.post(
  "/update",
  requiresLogin,
  upload.single("imageFile"),
  async (req, res) => {
    if (req.file) {
      const user = await User.findById(req.user._id);
      if (user.photo && !user.photo.startsWith("https://"))
        await unlinkAsync(user.photo);

      await User.updateOne({ _id: req.user._id }, { photo: req.file.path });
    }

    const { error } = validate(req.body);
    if (error) throw new Error(result.error.details[0].message);

    await User.findOneAndUpdate(
      {
        _id: req.user._id,
      },
      {
        name: req.body.name,
        phone: req.body.phone,
        birthDate: req.body.birthDate,
        bio: req.body.bio,
        address: req.body.address,
        linkedIn: req.body.linkedIn,
      }
    );
    res.redirect("/profile/edit");
  }
);

router.get("/posts/:id", requiresLogin, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id))
    throw new Error("Invalid post.");

  const user = await User.findById(req.params.id).select("name photo linkedIn");

  const posts = await Post.find({ "author.id": req.params.id }).lean().exec();

  if (!posts) throw new Error("There're no posts published by this user!");

  posts.forEach((post) => {
    post.publishDate = formatDate(post.publishDate);
    post.content = post.content.substr(0, 100);
  });

  let editView = false;
  if (req.params.id == req.user._id) editView = true;

  return res.render("profilePosts", {
    title: "Profile Posts",
    name: user.name,
    photo: user.photo,
    linkedIn: user.linkedIn || "",
    posts: posts,
    editView,
  });
});
module.exports = router;
