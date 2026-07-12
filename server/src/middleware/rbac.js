// Usage: router.post('/', requireAuth, requireRole('FLEET_MANAGER'), handler)
const requireRole =
  (...roles) =>
  (req, res, next) =>
    roles.includes(req.user?.role) ? next() : res.status(403).json({ error: 'Forbidden' })

module.exports = { requireRole }
