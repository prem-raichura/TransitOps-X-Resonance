const router = require('express').Router()
const { requireAuth } = require('../middleware/auth')
const { requireRole } = require('../middleware/rbac')
const analyticsService = require('../services/analyticsService')

router.use(requireAuth, requireRole('FINANCIAL_ANALYST'))

// GET /api/analytics/summary — 4 KPI cards
router.get('/summary', async (req, res, next) => {
  try {
    res.json(await analyticsService.summary())
  } catch (e) {
    next(e)
  }
})

// GET /api/analytics/monthly-revenue — [ { month, revenue } ]
router.get('/monthly-revenue', async (req, res, next) => {
  try {
    res.json(await analyticsService.monthlyRevenue())
  } catch (e) {
    next(e)
  }
})

// GET /api/analytics/costliest-vehicles — top 3 [ { vehicle, cost } ]
router.get('/costliest-vehicles', async (req, res, next) => {
  try {
    res.json(await analyticsService.costliestVehicles())
  } catch (e) {
    next(e)
  }
})

// GET /api/analytics/export/csv?report=trips|fuel|expenses|vehicles — CSV attachment
router.get('/export/csv', async (req, res, next) => {
  try {
    const { filename, csv } = await analyticsService.exportCsv(req.query.report || 'trips')
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`)
    res.send(csv)
  } catch (e) {
    next(e)
  }
})

module.exports = router
