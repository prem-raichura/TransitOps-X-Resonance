const router = require('express').Router()
const prisma = require('../lib/prisma')
const { requireAuth } = require('../middleware/auth')
const { requireRole } = require('../middleware/rbac')

// GET /api/settings — any authenticated role
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const settings = await prisma.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } })
    res.json(settings)
  } catch (err) {
    next(err)
  }
})

// PUT /api/settings — Fleet Manager only
router.put('/', requireAuth, requireRole('FLEET_MANAGER'), async (req, res, next) => {
  try {
    const { depotName, currency, distanceUnit } = req.body
    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      update: { depotName, currency, distanceUnit },
      create: { id: 1, depotName, currency, distanceUnit },
    })
    res.json(settings)
  } catch (err) {
    next(err)
  }
})

module.exports = router
