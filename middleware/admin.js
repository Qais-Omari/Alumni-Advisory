module.exports = function (req, res, next) {
  if (!req.user.isAdmin) {
    // return res.status(403).send("Access denied.");
    const err = new Error("You must be Adminstrator to view this page.");
    err.status = 403;
    return next(err);
  }
  next();
};
