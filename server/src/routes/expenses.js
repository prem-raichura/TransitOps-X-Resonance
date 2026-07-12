const router = require('express').Router()
const { requireAuth } = require('../middleware/auth')
const { requireRole } = require('../middleware/rbac')
const expenseService = require('../services/expenseService')

router.use(requireAuth)

// GET /api/expenses/summary — per-vehicle operational cost (fuel + maintenance). Analyst only.
// Declared before '/' so the literal path wins.
router.get('/summary', requireRole('FINANCIAL_ANALYST'), async (req, res, next) => {
  try {
    res.json(await expenseService.summary())
  } catch (e) {
    next(e)
  }
})

// GET /api/expenses/trips — trip options for expense/fuel modals (analyst has no /api/trips access).
router.get('/trips', requireRole('FINANCIAL_ANALYST'), async (req, res, next) => {
  try {
    res.json(await expenseService.tripOptions())
  } catch (e) {
    next(e)
  }
})

// GET /api/expenses — Financial Analyst (full) + Safety Officer (view)
router.get('/', requireRole('FINANCIAL_ANALYST', 'SAFETY_OFFICER'), async (req, res, next) => {
  try {
    res.json(await expenseService.list())
  } catch (e) {
    next(e)
  }
})

// POST /api/expenses — Financial Analyst only
router.post('/', requireRole('FINANCIAL_ANALYST'), async (req, res, next) => {
  try {
    res.status(201).json(await expenseService.create(req.body))
  } catch (e) {
    next(e)
  }
})

module.exports = router
