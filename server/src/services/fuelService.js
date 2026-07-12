const prisma = require('../lib/prisma')

// services throw { status, message } — caught by global error handler in index.js
const fail = (status, message) => {
  const e = new Error(message)
  e.status = status
  throw e
}

const VEHICLE_SEL = { select: { slug: true, name: true, regNo: true } }
const FUEL_INCLUDE = { vehicle: VEHICLE_SEL, trip: { select: { slug: true } } }

// GET /api/fuel — logs joined with vehicle (+ trip code). Driver-app logs appear here too (doc 11).
async function list() {
  return prisma.fuelLog.findMany({ include: FUEL_INCLUDE, orderBy: { date: 'desc' } })
}

// POST /api/fuel — manual analyst logging. Body: { vehicleSlug, tripSlug?, liters, cost, date }
async function create({ vehicleSlug, tripSlug, liters, cost, date } = {}) {
  if (!vehicleSlug) fail(400, 'Vehicle is required')
  const l = Number(liters)
  const c = Number(cost)
  if (!Number.isFinite(l) || l <= 0) fail(400, 'Valid litres are required')
  if (!Number.isFinite(c) || c < 0) fail(400, 'Valid fuel cost is required')

  const vehicle = await prisma.vehicle.findUnique({ where: { slug: vehicleSlug } })
  if (!vehicle) fail(404, 'Vehicle not found')

  let tripId = null
  if (tripSlug) {
    const trip = await prisma.trip.findUnique({ where: { slug: tripSlug } })
    if (!trip) fail(404, 'Trip not found')
    tripId = trip.id
  }

  return prisma.fuelLog.create({
    data: {
      vehicleId: vehicle.id,
      tripId,
      liters: l,
      cost: c,
      date: date ? new Date(date) : new Date(),
      loggedBy: 'ANALYST',
    },
    include: FUEL_INCLUDE,
  })
}

module.exports = { list, create }
