const prisma = require('../lib/prisma')

// Total operational cost per vehicle = Σ fuel.cost + Σ maintenance.cost (spec 3.7 auto-compute).
// Shared by Fuel/Expenses (07) AND Analytics (09) — single source of truth, do not duplicate.
async function perVehicleSummary() {
  const [vehicles, fuelByVehicle, maintByVehicle] = await Promise.all([
    prisma.vehicle.findMany({
      select: { id: true, slug: true, name: true, regNo: true },
      orderBy: { name: 'asc' },
    }),
    prisma.fuelLog.groupBy({ by: ['vehicleId'], _sum: { cost: true } }),
    prisma.maintenanceLog.groupBy({ by: ['vehicleId'], _sum: { cost: true } }),
  ])

  const fuelMap = Object.fromEntries(fuelByVehicle.map((r) => [r.vehicleId, r._sum.cost || 0]))
  const maintMap = Object.fromEntries(maintByVehicle.map((r) => [r.vehicleId, r._sum.cost || 0]))

  const rows = vehicles.map((v) => {
    const fuelCost = fuelMap[v.id] || 0
    const maintenanceCost = maintMap[v.id] || 0
    return {
      slug: v.slug,
      name: v.name,
      regNo: v.regNo,
      fuelCost,
      maintenanceCost,
      operationalCost: fuelCost + maintenanceCost,
    }
  })

  const totals = rows.reduce(
    (acc, r) => ({
      fuelCost: acc.fuelCost + r.fuelCost,
      maintenanceCost: acc.maintenanceCost + r.maintenanceCost,
      operationalCost: acc.operationalCost + r.operationalCost,
    }),
    { fuelCost: 0, maintenanceCost: 0, operationalCost: 0 },
  )

  return { vehicles: rows, totals }
}

// Per-vehicle maintenance cost map { vehicleId: Σcost } — reused when tagging expense rows.
async function maintenanceCostByVehicle() {
  const grouped = await prisma.maintenanceLog.groupBy({ by: ['vehicleId'], _sum: { cost: true } })
  return Object.fromEntries(grouped.map((r) => [r.vehicleId, r._sum.cost || 0]))
}

module.exports = { perVehicleSummary, maintenanceCostByVehicle }
