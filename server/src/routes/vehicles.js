const router = require('express').Router()
const prisma = require('../lib/prisma')
const { requireAuth } = require('../middleware/auth')

router.use(requireAuth)

// Read-only endpoints only — needed by Trips (vehicle pool) and Maintenance (vehicle select).
// CRUD (POST/PUT/DELETE) belongs to PLANS/03 and is still open for its owner.

// GET /api/vehicles?type=&status=&region=&search=
router.get('/', async (req, res, next) => {
  try {
    const { type, status, region, search } = req.query
    const where = {
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
      ...(region ? { region } : {}),
      ...(search ? { OR: [{ regNo: { contains: search, mode: 'insensitive' } }, { name: { contains: search, mode: 'insensitive' } }] } : {}),
    }
    res.json(await prisma.vehicle.findMany({ where, orderBy: { name: 'asc' } }))
  } catch (e) {
    next(e)
  }
})

// GET /api/vehicles/available — dispatch pool (Rules 2 & 4: only AVAILABLE)
router.get('/available', async (req, res, next) => {
  try {
    res.json(await prisma.vehicle.findMany({ where: { status: 'AVAILABLE' }, orderBy: { name: 'asc' } }))
  } catch (e) {
    next(e)
  }
})

// Write ops still stubbed — implement per PLANS/03
router.all('*', (req, res) => res.status(501).json({ error: 'Not implemented yet — see PLANS/03' }))

module.exports = router
