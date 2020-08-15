const winston = require("winston");
require("winston-mongodb");
require("express-async-errors");
const debug = require("debug")("development");

module.exports = function () {
  winston.handleExceptions(
    new winston.transports.Console({ colorize: true, prettyPrint: true }),
    new winston.transports.File({ filename: "uncaughtExceptions.log" })
  );

  process.on("unhandledRejection", (ex) => {
    debug("Unhandled Rejection");
    throw ex;
  });

  winston.add(winston.transports.File, {
    filename: "logfile.log",
    useUnifiedTopology: true,
  });

  winston.add(winston.transports.MongoDB, {
    db: "mongodb://localhost/alumni",
    options: { autoReconnect: true },
    level: "error",
  });
};
