const router = require('express').Router()
const prisma = require('../lib/prisma')
const { requireAuth } = require('../middleware/auth')
const { requireRole } = require('../middleware/rbac')

router.use(requireAuth)

// GET /api/fuel — all fuel logs (incl. driver-uploaded, with proof photo + GPS)
// Financial Analyst manages; Safety Officer views.
router.get('/', requireRole('FINANCIAL_ANALYST', 'SAFETY_OFFICER'), async (req, res, next) => {
  try {
    const logs = await prisma.fuelLog.findMany({
      include: {
        vehicle: { select: { slug: true, name: true, regNo: true } },
        trip: { select: { slug: true } },
      },
      orderBy: { date: 'desc' },
    })
    res.json(logs)
  } catch (err) {
    next(err)
  }
})

// POST /api/fuel — manual analyst entry (no photo required for office entry)
router.post('/', requireRole('FINANCIAL_ANALYST'), async (req, res, next) => {
  try {
    const { vehicleSlug, tripSlug, liters, cost, date } = req.body
    if (!vehicleSlug || liters == null || cost == null) {
      return res.status(400).json({ error: 'vehicleSlug, liters and cost are required' })
    }
    const vehicle = await prisma.vehicle.findUnique({ where: { slug: vehicleSlug } })
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' })
    const trip = tripSlug ? await prisma.trip.findUnique({ where: { slug: tripSlug } }) : null

    const log = await prisma.fuelLog.create({
      data: {
        vehicleId: vehicle.id,
        tripId: trip?.id || null,
        liters: Number(liters),
        cost: Number(cost),
        date: date ? new Date(date) : new Date(),
        loggedBy: 'ANALYST',
      },
    })
    res.status(201).json(log)
  } catch (err) {
    next(err)
  }
})

module.exports = router
