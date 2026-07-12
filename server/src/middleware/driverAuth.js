const jwt = require('jsonwebtoken')

// Verifies a driver-app JWT ({ driverId, role: 'DRIVER' }) and attaches req.driver = { id }.
// Walled off from staff routes: staff tokens (no driverId / wrong role) are rejected.
function requireDriver(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Authentication required' })

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    if (payload.role !== 'DRIVER' || !payload.driverId) {
      return res.status(403).json({ error: 'Driver access only' })
    }
    req.driver = { id: payload.driverId }
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

module.exports = { requireDriver }
