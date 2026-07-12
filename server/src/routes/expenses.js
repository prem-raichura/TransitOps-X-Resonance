const router = require('express').Router()
<<<<<<< HEAD
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
=======
const prisma = require('../lib/prisma')
const { requireAuth } = require('../middleware/auth')
const { requireRole } = require('../middleware/rbac')
const { operationalCostByVehicle, totalOperationalCost } = require('../services/costService')

router.use(requireAuth)

// GET /api/expenses — per-trip toll/misc with computed total
router.get('/', requireRole('FINANCIAL_ANALYST', 'SAFETY_OFFICER'), async (req, res, next) => {
  try {
    const expenses = await prisma.expense.findMany({
      include: { trip: { select: { slug: true, status: true, vehicle: { select: { name: true } } } } },
      orderBy: { date: 'desc' },
    })
    res.json(expenses.map((e) => ({ ...e, total: (e.tollCost || 0) + (e.miscCost || 0) })))
  } catch (err) {
    next(err)
  }
})

// GET /api/expenses/summary — operational cost (fuel + maintenance) per vehicle + grand total
router.get('/summary', requireRole('FINANCIAL_ANALYST', 'SAFETY_OFFICER'), async (req, res, next) => {
  try {
    const [byVehicle, totals] = await Promise.all([operationalCostByVehicle(), totalOperationalCost()])
    res.json({ byVehicle, totals })
  } catch (err) {
    next(err)
  }
})

// POST /api/expenses — Financial Analyst
router.post('/', requireRole('FINANCIAL_ANALYST'), async (req, res, next) => {
  try {
    const { tripSlug, tollCost, miscCost } = req.body
    if (!tripSlug) return res.status(400).json({ error: 'tripSlug is required' })
    const trip = await prisma.trip.findUnique({ where: { slug: tripSlug } })
    if (!trip) return res.status(404).json({ error: 'Trip not found' })

    const expense = await prisma.expense.create({
      data: { tripId: trip.id, tollCost: Number(tollCost) || 0, miscCost: Number(miscCost) || 0 },
    })
    res.status(201).json({ ...expense, total: expense.tollCost + expense.miscCost })
  } catch (err) {
    next(err)
>>>>>>> b03087912be8a91e1a21fd1a2aa45488e0eabd31
  }
})

module.exports = router
