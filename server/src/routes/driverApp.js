const router = require('express').Router()
const multer = require('multer')
const prisma = require('../lib/prisma')
const { requireDriver } = require('../middleware/driverAuth')
const { uploadImage } = require('../lib/cloudinary')
const tripService = require('../services/tripService')

const upload = multer({
  storage: multer.memoryStorage(), // serverless-safe: never touches disk
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB cap
})

// Every route below is scoped to the authenticated driver (req.driver.id).
router.use(requireDriver)

// list view — lightweight (no logs)
const TRIP_LIST_SELECT = {
  slug: true,
  source: true,
  destination: true,
  cargoKg: true,
  plannedKm: true,
  status: true,
  startOdometer: true,
  endOdometer: true,
  dispatchedAt: true,
  completionSubmittedAt: true,
  rejectionReason: true,
  vehicle: { select: { slug: true, name: true, regNo: true, type: true, odometer: true } },
}

// detail view — full history: fuel logs (with proof photo + GPS), expenses, completion GPS
const TRIP_DETAIL_SELECT = {
  ...TRIP_LIST_SELECT,
  completedLat: true,
  completedLng: true,
  completedBy: true,
  verifiedAt: true,
  fuelLogs: {
    select: { id: true, liters: true, cost: true, date: true, loggedBy: true, proofImageUrl: true, lat: true, lng: true },
    orderBy: { date: 'desc' },
  },
  expenses: {
    select: { id: true, tollCost: true, miscCost: true, date: true },
    orderBy: { date: 'desc' },
  },
}

// fetch a trip the driver actually owns, else 404 (never leak other drivers' trips)
async function ownTrip(driverId, slug, extra = {}) {
  const trip = await prisma.trip.findFirst({ where: { slug, driverId }, ...extra })
  if (!trip) {
    const e = new Error('Trip not found')
    e.status = 404
    throw e
  }
  return trip
}

// GET /api/driver/me — profile + assigned vehicle (from active trip) + location toggle
router.get('/me', async (req, res, next) => {
  try {
    const driver = await prisma.driver.findUnique({
      where: { id: req.driver.id },
      select: {
        slug: true, name: true, contact: true, licenseNo: true, licenseCategory: true,
        licenseExpiry: true, safetyScore: true, status: true, locationEnabled: true,
      },
    })
    if (!driver) return res.status(404).json({ error: 'Driver not found' })

    const activeTrip = await prisma.trip.findFirst({
      where: { driverId: req.driver.id, status: { in: ['DISPATCHED', 'PENDING_COMPLETION'] } },
      select: { slug: true, vehicle: { select: { slug: true, name: true, regNo: true } } },
    })

    res.json({ ...driver, licenseExpired: driver.licenseExpiry < new Date(), activeVehicle: activeTrip?.vehicle || null })
  } catch (err) {
    next(err)
  }
})

// GET /api/driver/trips — active (DISPATCHED / PENDING_COMPLETION) first, then history
router.get('/trips', async (req, res, next) => {
  try {
    const trips = await prisma.trip.findMany({
      where: { driverId: req.driver.id },
      select: TRIP_LIST_SELECT,
      orderBy: { createdAt: 'desc' },
    })
    const rank = (s) => (s === 'DISPATCHED' || s === 'PENDING_COMPLETION' ? 0 : 1)
    trips.sort((a, b) => rank(a.status) - rank(b.status))
    res.json(trips)
  } catch (err) {
    next(err)
  }
})

// GET /api/driver/trips/:slug — detail (must be his trip)
router.get('/trips/:slug', async (req, res, next) => {
  try {
    const trip = await ownTrip(req.driver.id, req.params.slug, { select: TRIP_DETAIL_SELECT })
    res.json(trip)
  } catch (err) {
    next(err)
  }
})

// PUT /api/driver/location-sharing { enabled }
router.put('/location-sharing', async (req, res, next) => {
  try {
    const enabled = !!req.body.enabled
    const driver = await prisma.driver.update({
      where: { id: req.driver.id },
      data: { locationEnabled: enabled },
      select: { locationEnabled: true },
    })
    res.json(driver)
  } catch (err) {
    next(err)
  }
})

// POST /api/driver/location { lat, lng } — rejected 409 if sharing disabled (doc 12)
router.post('/location', async (req, res, next) => {
  try {
    const { lat, lng } = req.body
    if (lat == null || lng == null) return res.status(400).json({ error: 'lat and lng are required' })

    const driver = await prisma.driver.findUnique({ where: { id: req.driver.id }, select: { locationEnabled: true } })
    if (!driver.locationEnabled) return res.status(409).json({ error: 'Location sharing is off' })

    const activeTrip = await prisma.trip.findFirst({
      where: { driverId: req.driver.id, status: 'DISPATCHED' },
      select: { id: true },
    })

    await prisma.$transaction([
      prisma.locationPing.create({
        data: { driverId: req.driver.id, tripId: activeTrip?.id || null, lat: Number(lat), lng: Number(lng) },
      }),
      prisma.driver.update({
        where: { id: req.driver.id },
        data: { lastLat: Number(lat), lastLng: Number(lng), lastPingAt: new Date() },
      }),
    ])
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

// POST /api/driver/trips/:slug/fuel — multipart, geotagged fuel-meter photo MANDATORY
router.post('/trips/:slug/fuel', upload.single('proofImage'), async (req, res, next) => {
  try {
    const trip = await ownTrip(req.driver.id, req.params.slug)
    if (trip.status !== 'DISPATCHED') return res.status(400).json({ error: 'Fuel can only be logged on an active trip' })

    const { liters, cost, lat, lng } = req.body
    if (!req.file || lat == null || lng == null) {
      return res.status(400).json({ error: 'Fuel meter photo with GPS required' })
    }
    if (liters == null || cost == null) return res.status(400).json({ error: 'liters and cost are required' })

    const proofImageUrl = await uploadImage(req.file.buffer, { folder: 'transitops/fuel-proofs' })

    const fuelLog = await prisma.fuelLog.create({
      data: {
        vehicleId: trip.vehicleId,
        tripId: trip.id,
        liters: Number(liters),
        cost: Number(cost),
        date: new Date(),
        loggedBy: 'DRIVER',
        proofImageUrl,
        lat: Number(lat),
        lng: Number(lng),
      },
    })
    res.status(201).json(fuelLog)
  } catch (err) {
    next(err)
  }
})

// POST /api/driver/trips/:slug/expense { miscCost, note } — oil change / top-ups on active trip
router.post('/trips/:slug/expense', async (req, res, next) => {
  try {
    const trip = await ownTrip(req.driver.id, req.params.slug)
    if (trip.status !== 'DISPATCHED') return res.status(400).json({ error: 'Expenses can only be added on an active trip' })

    const { miscCost } = req.body
    if (miscCost == null) return res.status(400).json({ error: 'miscCost is required' })

    const expense = await prisma.expense.create({
      data: { tripId: trip.id, tollCost: 0, miscCost: Number(miscCost) },
    })
    res.status(201).json(expense)
  } catch (err) {
    next(err)
  }
})

// POST /api/driver/trips/:slug/submit-completion { endOdometer, lat, lng } — GPS MANDATORY, -> PENDING_COMPLETION
router.post('/trips/:slug/submit-completion', async (req, res, next) => {
  try {
    await ownTrip(req.driver.id, req.params.slug) // ownership guard; service does status/validation
    const trip = await tripService.submitCompletion(req.params.slug, req.body)
    res.json(trip)
  } catch (err) {
    next(err)
  }
})

module.exports = router
