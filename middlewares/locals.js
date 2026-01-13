module.exports = (req, res, next) => {
  res.locals.isLoggedIn = req.session.isLoggedIn;
  res.locals.userId = req.session.userId;
  next();
};