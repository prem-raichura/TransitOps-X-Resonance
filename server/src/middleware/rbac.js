<<<<<<< HEAD
// Role guard. Use after `auth` middleware so req.user.role is set.
const requireRole = (...roles) => (req, res, next) =>
  req.user && roles.includes(req.user.role)
    ? next()
    : res.status(403).json({ error: 'Forbidden' });

module.exports = { requireRole };
=======
// Usage: router.post('/', requireAuth, requireRole('FLEET_MANAGER'), handler)
const requireRole =
  (...roles) =>
  (req, res, next) =>
    roles.includes(req.user?.role) ? next() : res.status(403).json({ error: 'Forbidden' })

module.exports = { requireRole }
>>>>>>> 6db0e718af9c7de375e68fbaa07109db74c7cb65
