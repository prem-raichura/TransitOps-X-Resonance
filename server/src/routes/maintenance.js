const router = require('express').Router()
const { requireAuth } = require('../middleware/auth')
const { requireRole } = require('../middleware/rbac')
const maintenanceService = require('../services/maintenanceService')

router.use(requireAuth)

// Routes use record-code slug (mnt-001), never the cuid id.

// GET /api/maintenance — service log with vehicle info
router.get('/', requireRole('FLEET_MANAGER', 'FINANCIAL_ANALYST'), async (req, res, next) => {
  try {
    res.json(await maintenanceService.list())
  } catch (e) {
    next(e)
  }
})

// POST /api/maintenance — create record; Rule 9: vehicle auto -> IN_SHOP
router.post('/', requireRole('FLEET_MANAGER'), async (req, res, next) => {
  try {
    res.status(201).json(await maintenanceService.create(req.body))
  } catch (e) {
    next(e)
  }
})

// POST /api/maintenance/:slug/close — Rule 10: vehicle -> AVAILABLE unless retired
router.post('/:slug/close', requireRole('FLEET_MANAGER'), async (req, res, next) => {
  try {
    res.json(await maintenanceService.close(req.params.slug))
  } catch (e) {
    next(e)
  }
})

module.exports = router
