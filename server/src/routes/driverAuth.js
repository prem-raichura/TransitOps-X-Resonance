const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../lib/prisma')

const MAX_FAILED_LOGINS = 5
const LOCK_MINUTES = 15
const TOKEN_EXPIRY = '8h'

// POST /api/driver-auth/login { phone, password }
// Login id is the driver's contact number. JWT carries { driverId, role: 'DRIVER' }.
router.post('/login', async (req, res, next) => {
  try {
    const { phone, password } = req.body || {}
    if (!phone || !password) return res.status(400).json({ error: 'Phone and password are required' })

    const driver = await prisma.driver.findUnique({ where: { contact: String(phone).trim() } })
    // no account or credentials never provisioned -> generic invalid message
    if (!driver || !driver.passwordHash) return res.status(401).json({ error: 'Invalid credentials' })

    if (driver.lockedUntil && driver.lockedUntil > new Date()) {
      return res.status(403).json({ error: `Account locked after ${MAX_FAILED_LOGINS} failed attempts. Try again later.` })
    }

    if (driver.status === 'SUSPENDED') {
      return res.status(403).json({ error: 'Account suspended — contact dispatcher' })
    }

    const valid = await bcrypt.compare(password, driver.passwordHash)
    if (!valid) {
      const failedLogins = driver.failedLogins + 1
      const locked = failedLogins >= MAX_FAILED_LOGINS
      await prisma.driver.update({
        where: { id: driver.id },
        data: {
          failedLogins: locked ? 0 : failedLogins,
          lockedUntil: locked ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000) : null,
        },
      })
      if (locked) {
        return res.status(403).json({ error: `Account locked after ${MAX_FAILED_LOGINS} failed attempts. Try again later.` })
      }
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    await prisma.driver.update({ where: { id: driver.id }, data: { failedLogins: 0, lockedUntil: null } })

    const token = jwt.sign({ driverId: driver.id, role: 'DRIVER' }, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY })
    res.json({
      token,
      driver: { slug: driver.slug, name: driver.name, contact: driver.contact },
    })
  } catch (err) {
    next(err)
  }
})

module.exports = router
