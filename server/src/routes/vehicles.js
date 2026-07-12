<<<<<<< HEAD
// Vehicle registry routes (doc 03). Thin controllers -> vehicleService.
const express = require('express');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const vehicleService = require('../services/vehicleService');

const router = express.Router();

// All vehicle routes require an authenticated user.
router.use(auth);

// GET /api/vehicles — any authenticated role (dashboard/analysts need read).
router.get('/', async (req, res, next) => {
  try {
    const { type, status, search, region } = req.query;
    res.json(await vehicleService.list({ type, status, search, region }));
  } catch (err) {
    next(err);
  }
});

// GET /api/vehicles/available — dispatch pool (AVAILABLE only). Defined before :slug.
router.get('/available', async (req, res, next) => {
  try {
    res.json(await vehicleService.listAvailable());
  } catch (err) {
    next(err);
  }
});

// GET /api/vehicles/:slug — single lookup by slug.
router.get('/:slug', async (req, res, next) => {
  try {
    res.json(await vehicleService.getBySlug(req.params.slug));
  } catch (err) {
    next(err);
  }
});

// POST /api/vehicles — Fleet Manager only.
router.post('/', requireRole('FLEET_MANAGER'), async (req, res, next) => {
  try {
    res.status(201).json(await vehicleService.create(req.body));
  } catch (err) {
    next(err);
  }
});

// PUT /api/vehicles/:slug — Fleet Manager only.
router.put('/:slug', requireRole('FLEET_MANAGER'), async (req, res, next) => {
  try {
    res.json(await vehicleService.update(req.params.slug, req.body));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/vehicles/:slug — Fleet Manager only. Soft-retires if trips exist.
router.delete('/:slug', requireRole('FLEET_MANAGER'), async (req, res, next) => {
  try {
    res.json(await vehicleService.remove(req.params.slug));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
=======
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
>>>>>>> 6db0e718af9c7de375e68fbaa07109db74c7cb65
