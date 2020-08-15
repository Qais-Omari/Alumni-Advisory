const mongoose = require("mongoose");
const debug = require("debug")("development");

module.exports = function () {
  mongoose
    .connect("mongodb://localhost/alumni", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => debug("Connected to MongoDB"));

  const db = mongoose.connection;
  mongoose.set("useNewUrlParser", true);
  mongoose.set("useFindAndModify", false);
  mongoose.set("useCreateIndex", true);
  return db;
};
