// Dashboard KPI endpoint (doc 08, mockup screen 1). All roles land here (Dispatcher's home page).
const router = require('express').Router()
const prisma = require('../lib/prisma')
const { requireAuth } = require('../middleware/auth')

router.use(requireAuth)

const VEHICLE_STATUSES = ['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED']

// ETA for a dispatched trip — no live GPS feed, so estimate arrival time from dispatchedAt +
// planned distance at an average speed, then report minutes remaining until that arrival time.
const AVG_SPEED_KMH = 40
function etaMinutes(trip) {
  if (trip.status !== 'DISPATCHED' || !trip.dispatchedAt) return null
  const durationMs = (trip.plannedKm / AVG_SPEED_KMH) * 60 * 60 * 1000
  const arrivalAt = new Date(trip.dispatchedAt).getTime() + durationMs
  return Math.max(0, Math.round((arrivalAt - Date.now()) / 60000))
}

// GET /api/dashboard?type=&status=&region= — single round-trip payload
// Filters narrow vehicle-based KPIs + the status breakdown only (spec 3.2); trip/driver KPIs are fleet-wide.
router.get('/', async (req, res, next) => {
  try {
    const { type, status, region } = req.query
    const vehicleFilter = {
      ...(type ? { type } : {}),
      ...(status ? { status } : {}),
      ...(region ? { region } : {}),
    }

    const [
      activeVehicles,
      availableVehicles,
      inMaintenance,
      onTripVehicles,
      activeTrips,
      pendingTrips,
      driversOnDuty,
      recentTripsRaw,
      statusGroups,
    ] = await Promise.all([
      prisma.vehicle.count({ where: { ...vehicleFilter, status: { not: 'RETIRED' } } }),
      prisma.vehicle.count({ where: { ...vehicleFilter, status: 'AVAILABLE' } }),
      prisma.vehicle.count({ where: { ...vehicleFilter, status: 'IN_SHOP' } }),
      prisma.vehicle.count({ where: { ...vehicleFilter, status: 'ON_TRIP' } }),
      prisma.trip.count({ where: { status: 'DISPATCHED' } }),
      prisma.trip.count({ where: { status: 'DRAFT' } }),
      prisma.driver.count({ where: { status: { in: ['AVAILABLE', 'ON_TRIP'] } } }),
      prisma.trip.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { vehicle: true, driver: true } }),
      prisma.vehicle.groupBy({ by: ['status'], where: vehicleFilter, _count: true }),
    ])

    const fleetUtilization = activeVehicles > 0 ? Math.round((onTripVehicles / activeVehicles) * 100) : 0

    const vehicleStatusBreakdown = VEHICLE_STATUSES.reduce((acc, s) => ({ ...acc, [s]: 0 }), {})
    statusGroups.forEach((g) => {
      vehicleStatusBreakdown[g.status] = g._count
    })

    const recentTrips = recentTripsRaw.map((t) => ({
      id: t.slug,
      vehicle: t.vehicle?.name ?? '—',
      driver: t.driver?.name ?? '—',
      status: t.status,
      eta: etaMinutes(t),
    }))

    res.json({
      kpis: { activeVehicles, availableVehicles, inMaintenance, activeTrips, pendingTrips, driversOnDuty, fleetUtilization },
      recentTrips,
      vehicleStatusBreakdown,
    })
  } catch (err) {
    next(err)
  }
})

module.exports = router
