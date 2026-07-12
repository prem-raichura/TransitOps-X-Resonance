const router = require('express').Router()
const { requireAuth } = require('../middleware/auth')
const { requireRole } = require('../middleware/rbac')
const tripService = require('../services/tripService')

router.use(requireAuth)

// Routes use trip-code slug (tr-001), never the cuid id.

// GET /api/trips?status= — live board data
router.get('/', requireRole('DISPATCHER', 'SAFETY_OFFICER'), async (req, res, next) => {
  try {
    res.json(await tripService.list({ status: req.query.status }))
  } catch (e) {
    next(e)
  }
})

// POST /api/trips — create as DRAFT (validates capacity immediately)
router.post('/', requireRole('DISPATCHER'), async (req, res, next) => {
  try {
    res.status(201).json(await tripService.create(req.body))
  } catch (e) {
    next(e)
  }
})

// POST /api/trips/:slug/dispatch
router.post('/:slug/dispatch', requireRole('DISPATCHER'), async (req, res, next) => {
  try {
    res.json(await tripService.dispatch(req.params.slug))
  } catch (e) {
    next(e)
  }
})

// POST /api/trips/:slug/complete — dispatcher direct completion
router.post('/:slug/complete', requireRole('DISPATCHER'), async (req, res, next) => {
  try {
    res.json(await tripService.complete(req.params.slug, req.body, 'DISPATCHER'))
  } catch (e) {
    next(e)
  }
})

// POST /api/trips/:slug/approve-completion — approve driver's PENDING_COMPLETION request
router.post('/:slug/approve-completion', requireRole('DISPATCHER'), async (req, res, next) => {
  try {
    res.json(await tripService.approveCompletion(req.params.slug))
  } catch (e) {
    next(e)
  }
})

// POST /api/trips/:slug/reject-completion { reason }
router.post('/:slug/reject-completion', requireRole('DISPATCHER'), async (req, res, next) => {
  try {
    res.json(await tripService.rejectCompletion(req.params.slug, req.body?.reason))
  } catch (e) {
    next(e)
  }
})

// POST /api/trips/:slug/cancel
router.post('/:slug/cancel', requireRole('DISPATCHER'), async (req, res, next) => {
  try {
    res.json(await tripService.cancel(req.params.slug))
  } catch (e) {
    next(e)
  }
})

module.exports = router
