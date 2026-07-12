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

// Stub — implement per the matching PLANS/ doc
router.all('*', (req, res) => res.status(501).json({ error: 'Not implemented yet — see PLANS/' }))

module.exports = router
>>>>>>> 6db0e718af9c7de375e68fbaa07109db74c7cb65
