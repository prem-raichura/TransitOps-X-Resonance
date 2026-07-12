const prisma = require('../lib/prisma')
const costService = require('./costService')

// services throw { status, message } — caught by global error handler in index.js
const fail = (status, message) => {
  const e = new Error(message)
  e.status = status
  throw e
}

// GET /api/expenses — per-trip rows: toll + misc + linked maintenance cost, computed total.
// "Maint." is read-only, pulled from the trip vehicle's maintenance logs (mockup screen 6).
async function list() {
  const [expenses, maintMap] = await Promise.all([
    prisma.expense.findMany({
      include: {
        trip: {
          select: {
            slug: true,
            source: true,
            destination: true,
            status: true,
            vehicle: { select: { id: true, slug: true, name: true, regNo: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
    }),
    costService.maintenanceCostByVehicle(),
  ])

  return expenses.map((e) => {
    const v = e.trip.vehicle
    const maintenanceCost = maintMap[v.id] || 0
    return {
      id: e.id,
      tripSlug: e.trip.slug,
      route: `${e.trip.source} → ${e.trip.destination}`,
      tripStatus: e.trip.status,
      vehicle: { slug: v.slug, name: v.name, regNo: v.regNo },
      tollCost: e.tollCost,
      miscCost: e.miscCost,
      maintenanceCost,
      total: e.tollCost + e.miscCost + maintenanceCost,
    }
  })
}

// POST /api/expenses — Body: { tripSlug, tollCost, miscCost }
async function create({ tripSlug, tollCost, miscCost } = {}) {
  if (!tripSlug) fail(400, 'Trip is required')
  const toll = Number(tollCost || 0)
  const misc = Number(miscCost || 0)
  if (!Number.isFinite(toll) || toll < 0) fail(400, 'Valid toll cost is required')
  if (!Number.isFinite(misc) || misc < 0) fail(400, 'Valid other cost is required')

  const trip = await prisma.trip.findUnique({ where: { slug: tripSlug } })
  if (!trip) fail(404, 'Trip not found')

  return prisma.expense.create({ data: { tripId: trip.id, tollCost: toll, miscCost: misc } })
}

// GET /api/expenses/summary — per-vehicle operational cost (delegates to shared costService).
async function summary() {
  return costService.perVehicleSummary()
}

// GET /api/expenses/trips — trip picker options for expense/fuel modals.
// Analyst has no access to /api/trips (dispatcher/safety only), so expose a minimal read here.
async function tripOptions() {
  const trips = await prisma.trip.findMany({
    select: {
      slug: true,
      source: true,
      destination: true,
      status: true,
      vehicle: { select: { slug: true, name: true, regNo: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return trips.map((t) => ({
    slug: t.slug,
    route: `${t.source} → ${t.destination}`,
    status: t.status,
    vehicle: t.vehicle,
  }))
}

module.exports = { list, create, summary, tripOptions }
