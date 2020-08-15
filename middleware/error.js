const winston = require("winston");

module.exports = function (err, req, res, next) {
  winston.log("error", err.message, err);
  res.status(err.status || 500);
  res.render("error", {
    message: err.message,
    error: {},
  });
};

// error
// warn
// info
// verbose
// debug
// silly
