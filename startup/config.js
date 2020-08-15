const config = require("config");
const debug = require("debug")("development");

module.exports = function () {
  if (!config.get("jwtPrivateKey")) {
    debug("FATAL ERROR: jwtPrivateKey is not defined");
    throw new Error("FATAL ERROR: jwtPrivateKey is not defined");
  }
};
