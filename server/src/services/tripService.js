const prisma = require('../lib/prisma')

// services throw { status, message } — caught by global error handler in index.js
const fail = (status, message) => {
  const e = new Error(message)
  e.status = status
  throw e
}

const TRIP_INCLUDE = { vehicle: true, driver: true }

// next sequential trip code, e.g. "tr-001". Zero-padded 3 digits keeps string sort == numeric sort.
async function nextTripSlug(tx) {
  const [last] = await tx.trip.findMany({
    where: { slug: { startsWith: 'tr-' } },
    orderBy: { slug: 'desc' },
    take: 1,
  })
  let n = 1
  if (last) {
    const m = /^tr-(\d+)$/.exec(last.slug)
    if (m) n = parseInt(m[1], 10) + 1
  }
  return `tr-${String(n).padStart(3, '0')}`
}

// Rule 7 safety score = trip completion %: completed / (completed + cancelled) * 100
async function recomputeSafetyScore(tx, driverId) {
  const [completed, cancelled] = await Promise.all([
    tx.trip.count({ where: { driverId, status: 'COMPLETED' } }),
    tx.trip.count({ where: { driverId, status: 'CANCELLED' } }),
  ])
  const total = completed + cancelled
  if (total === 0) return 100
  return Math.round((completed / total) * 100)
}

// Shared Rule 7 transition — trip -> COMPLETED, vehicle + driver -> AVAILABLE, fuel log.
// Caller passes completedBy ("DISPATCHER" | "DRIVER"); DRIVER path also stamps verifiedAt.
async function finalize(tx, trip, { endOdometer, revenue, fuelLiters, fuelCost, completedBy, completedLat, completedLng }) {
  const end = endOdometer != null ? Number(endOdometer) : trip.endOdometer

  const data = {
    status: 'COMPLETED',
    completedAt: new Date(),
    completedBy,
  }
  if (end != null) data.endOdometer = end
  if (revenue != null) data.revenue = Number(revenue)
  if (completedLat != null) data.completedLat = Number(completedLat)
  if (completedLng != null) data.completedLng = Number(completedLng)
  if (completedBy === 'DRIVER') data.verifiedAt = new Date()

  // trip flips first so the safety-score count includes it
  await tx.trip.update({ where: { id: trip.id }, data })

  await tx.vehicle.update({
    where: { id: trip.vehicleId },
    data: { status: 'AVAILABLE', ...(end != null ? { odometer: end } : {}) },
  })

  const safetyScore = await recomputeSafetyScore(tx, trip.driverId)
  await tx.driver.update({ where: { id: trip.driverId }, data: { status: 'AVAILABLE', safetyScore } })

  // On Complete: odometer -> fuel log -> expenses (mockup). Fuel log only when both fields present.
  if (fuelLiters != null && fuelCost != null) {
    await tx.fuelLog.create({
      data: {
        vehicleId: trip.vehicleId,
        tripId: trip.id,
        liters: Number(fuelLiters),
        cost: Number(fuelCost),
        date: new Date(),
        loggedBy: 'AUTO',
      },
    })
  }

  return tx.trip.findUnique({ where: { id: trip.id }, include: TRIP_INCLUDE })
}

// GET /api/trips — live board data
async function list({ status } = {}) {
  const where = {}
  if (status) where.status = status
  return prisma.trip.findMany({ where, include: TRIP_INCLUDE, orderBy: { createdAt: 'desc' } })
}

// POST /api/trips — create DRAFT, validate capacity immediately (Rule 5), server assigns slug
async function create(body = {}) {
  const { source, destination, vehicleSlug, driverSlug, cargoKg, plannedKm } = body
  if (!source || !destination) fail(400, 'Source and destination are required')
  if (!vehicleSlug) fail(400, 'Vehicle is required')
  if (!driverSlug) fail(400, 'Driver is required')

  const cargo = Number(cargoKg)
  const km = Number(plannedKm)
  if (!Number.isFinite(cargo) || cargo < 0) fail(400, 'Valid cargo weight is required')
  if (!Number.isFinite(km) || km < 0) fail(400, 'Valid planned distance is required')

  return prisma.$transaction(async (tx) => {
    const vehicle = await tx.vehicle.findUnique({ where: { slug: vehicleSlug } })
    if (!vehicle) fail(404, 'Vehicle not found')
    const driver = await tx.driver.findUnique({ where: { slug: driverSlug } })
    if (!driver) fail(404, 'Driver not found')

    if (cargo > vehicle.capacityKg) fail(400, `Capacity exceeded by ${cargo - vehicle.capacityKg} kg — dispatch blocked`) // Rule 5

    const slug = await nextTripSlug(tx)
    return tx.trip.create({
      data: {
        slug,
        source,
        destination,
        vehicleId: vehicle.id,
        driverId: driver.id,
        cargoKg: cargo,
        plannedKm: km,
        status: 'DRAFT',
      },
      include: TRIP_INCLUDE,
    })
  })
}

// POST /api/trips/:slug/dispatch — full validation (Rules 2-6) in one transaction
async function dispatch(slug) {
  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({ where: { slug } })
    if (!trip) fail(404, 'Trip not found')
    if (trip.status !== 'DRAFT') fail(400, 'Only draft trips can be dispatched')

    // re-fetch inside the transaction so status checks use live data
    const vehicle = await tx.vehicle.findUnique({ where: { id: trip.vehicleId } })
    const driver = await tx.driver.findUnique({ where: { id: trip.driverId } })

    if (vehicle.status !== 'AVAILABLE') fail(400, `Vehicle is ${vehicle.status} — not available for dispatch`) // Rules 2 & 4
    if (driver.status !== 'AVAILABLE') fail(400, `Driver is ${driver.status} — not available for dispatch`) // Rules 3 & 4
    if (!(new Date(driver.licenseExpiry) > new Date())) fail(400, 'Driver license expired') // Rule 3
    if (trip.cargoKg > vehicle.capacityKg) fail(400, `Capacity exceeded by ${trip.cargoKg - vehicle.capacityKg} kg — dispatch blocked`) // Rule 5

    await tx.vehicle.update({ where: { id: vehicle.id }, data: { status: 'ON_TRIP' } }) // Rule 6
    await tx.driver.update({ where: { id: driver.id }, data: { status: 'ON_TRIP' } }) // Rule 6

    return tx.trip.update({
      where: { slug },
      data: { status: 'DISPATCHED', dispatchedAt: new Date(), startOdometer: vehicle.odometer },
      include: TRIP_INCLUDE,
    })
  })
}

// POST /api/trips/:slug/complete — dispatcher direct completion (he is the verifier), GPS optional
async function complete(slug, body = {}, actor = 'DISPATCHER') {
  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({ where: { slug } })
    if (!trip) fail(404, 'Trip not found')
    if (trip.status !== 'DISPATCHED') fail(400, 'Only dispatched trips can be completed')
    if (body.endOdometer == null) fail(400, 'End odometer is required')
    if (actor === 'DRIVER' && (body.lat == null || body.lng == null)) fail(400, 'GPS location is required to complete') // doc 11

    return finalize(tx, trip, {
      endOdometer: body.endOdometer,
      revenue: body.revenue,
      fuelLiters: body.fuelLiters,
      fuelCost: body.fuelCost,
      completedBy: actor,
      completedLat: body.lat,
      completedLng: body.lng,
    })
  })
}

// Driver slider (doc 11 route) — does NOT complete. Trip -> PENDING_COMPLETION, vehicle + driver stay ON_TRIP.
async function submitCompletion(slug, body = {}) {
  const { endOdometer, lat, lng } = body
  if (endOdometer == null) fail(400, 'End odometer is required')
  if (lat == null || lng == null) fail(400, 'GPS location is required to complete')

  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({ where: { slug } })
    if (!trip) fail(404, 'Trip not found')
    if (trip.status !== 'DISPATCHED') fail(400, 'Only dispatched trips can be submitted for completion')

    return tx.trip.update({
      where: { slug },
      data: {
        status: 'PENDING_COMPLETION',
        endOdometer: Number(endOdometer),
        completedLat: Number(lat),
        completedLng: Number(lng),
        completionSubmittedAt: new Date(),
      },
      include: TRIP_INCLUDE,
    })
  })
}

// POST /api/trips/:slug/approve-completion — approves driver's request, Rule 7 fires
async function approveCompletion(slug) {
  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({ where: { slug } })
    if (!trip) fail(404, 'Trip not found')
    if (trip.status !== 'PENDING_COMPLETION') fail(400, 'No completion awaiting approval')

    return finalize(tx, trip, {
      endOdometer: trip.endOdometer,
      revenue: trip.revenue,
      completedBy: 'DRIVER',
      completedLat: trip.completedLat,
      completedLng: trip.completedLng,
    })
  })
}

// POST /api/trips/:slug/reject-completion { reason } — back to DISPATCHED, submitted fields kept for audit
async function rejectCompletion(slug, reason) {
  if (!reason) fail(400, 'Rejection reason is required')
  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({ where: { slug } })
    if (!trip) fail(404, 'Trip not found')
    if (trip.status !== 'PENDING_COMPLETION') fail(400, 'No completion awaiting approval')

    // submitted odometer/GPS left intact for audit; vehicle + driver already ON_TRIP so no restore
    return tx.trip.update({ where: { slug }, data: { status: 'DISPATCHED' }, include: TRIP_INCLUDE })
  })
}

// POST /api/trips/:slug/cancel — restore statuses if vehicle/driver were held (Rule 8)
async function cancel(slug) {
  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({ where: { slug } })
    if (!trip) fail(404, 'Trip not found')
    if (trip.status === 'COMPLETED' || trip.status === 'CANCELLED') fail(400, 'Trip already finalised')

    if (trip.status === 'DISPATCHED' || trip.status === 'PENDING_COMPLETION') {
      await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: 'AVAILABLE' } }) // Rule 8
      await tx.driver.update({ where: { id: trip.driverId }, data: { status: 'AVAILABLE' } }) // Rule 8
    }

    return tx.trip.update({ where: { slug }, data: { status: 'CANCELLED' }, include: TRIP_INCLUDE })
  })
}

module.exports = {
  list,
  create,
  dispatch,
  complete,
  submitCompletion,
  approveCompletion,
  rejectCompletion,
  cancel,
}
