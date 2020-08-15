module.exports = function (req, callback) {
  const corsOptions = { origin: true, credentials: true };
  callback(null, corsOptions); // callback expects two parameters: error and options
};
