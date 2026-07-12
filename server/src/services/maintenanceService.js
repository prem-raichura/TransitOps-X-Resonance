const prisma = require('../lib/prisma')

// services throw { status, message } — caught by global error handler in index.js
const fail = (status, message) => {
  const e = new Error(message)
  e.status = status
  throw e
}

// next sequential record code, e.g. "mnt-001" (same scheme as trip slugs)
async function nextSlug(tx) {
  const [last] = await tx.maintenanceLog.findMany({
    where: { slug: { startsWith: 'mnt-' } },
    orderBy: { slug: 'desc' },
    take: 1,
  })
  let n = 1
  if (last) {
    const m = /^mnt-(\d+)$/.exec(last.slug)
    if (m) n = parseInt(m[1], 10) + 1
  }
  return `mnt-${String(n).padStart(3, '0')}`
}

async function list() {
  return prisma.maintenanceLog.findMany({
    include: { vehicle: { select: { slug: true, name: true, regNo: true, status: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

// Rule 9: creating an active record auto-switches the vehicle to IN_SHOP
async function create({ vehicleSlug, serviceType, cost, date }) {
  if (!vehicleSlug || !serviceType || cost == null) fail(400, 'vehicleSlug, serviceType and cost are required')

  return prisma.$transaction(async (tx) => {
    const vehicle = await tx.vehicle.findUnique({ where: { slug: vehicleSlug } })
    if (!vehicle) fail(404, 'Vehicle not found')
    if (vehicle.status === 'ON_TRIP') fail(400, 'Vehicle is on a trip — complete or cancel the trip first')

    const log = await tx.maintenanceLog.create({
      data: {
        slug: await nextSlug(tx),
        vehicleId: vehicle.id,
        serviceType,
        cost: Number(cost),
        date: date ? new Date(date) : new Date(),
        status: 'IN_SHOP',
      },
      include: { vehicle: { select: { slug: true, name: true, regNo: true, status: true } } },
    })

    if (vehicle.status !== 'RETIRED') {
      await tx.vehicle.update({ where: { id: vehicle.id }, data: { status: 'IN_SHOP' } })
    }

    return log
  })
}

// Rule 10: closing maintenance restores the vehicle to AVAILABLE (unless retired)
async function close(slug) {
  return prisma.$transaction(async (tx) => {
    const log = await tx.maintenanceLog.findUnique({ where: { slug }, include: { vehicle: true } })
    if (!log) fail(404, 'Maintenance record not found')
    if (log.status === 'COMPLETED') fail(400, 'Record is already closed')

    const updated = await tx.maintenanceLog.update({
      where: { id: log.id },
      data: { status: 'COMPLETED' },
      include: { vehicle: { select: { slug: true, name: true, regNo: true, status: true } } },
    })

    // only restore if no OTHER open record keeps it in the shop
    const stillOpen = await tx.maintenanceLog.count({
      where: { vehicleId: log.vehicleId, status: 'IN_SHOP' },
    })
    if (log.vehicle.status !== 'RETIRED' && stillOpen === 0) {
      await tx.vehicle.update({ where: { id: log.vehicleId }, data: { status: 'AVAILABLE' } })
    }

    return updated
  })
}

module.exports = { list, create, close }
