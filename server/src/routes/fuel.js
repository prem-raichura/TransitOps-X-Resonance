const router = require('express').Router()
const { requireAuth } = require('../middleware/auth')
const { requireRole } = require('../middleware/rbac')
const fuelService = require('../services/fuelService')

router.use(requireAuth)

// GET /api/fuel — Financial Analyst (full) + Safety Officer (view)
router.get('/', requireRole('FINANCIAL_ANALYST', 'SAFETY_OFFICER'), async (req, res, next) => {
  try {
    res.json(await fuelService.list())
  } catch (e) {
    next(e)
  }
})

// POST /api/fuel — Financial Analyst only
router.post('/', requireRole('FINANCIAL_ANALYST'), async (req, res, next) => {
  try {
    res.status(201).json(await fuelService.create(req.body))
  } catch (e) {
    next(e)
  }
})

module.exports = router
