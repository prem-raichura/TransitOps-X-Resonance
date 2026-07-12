// Role guard. Use after `auth` middleware so req.user.role is set.
const requireRole = (...roles) => (req, res, next) =>
  req.user && roles.includes(req.user.role)
    ? next()
    : res.status(403).json({ error: 'Forbidden' });

module.exports = { requireRole };
