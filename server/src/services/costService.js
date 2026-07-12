const prisma = require('../lib/prisma')

// Shared cost aggregation — used by expenseService (07) and anywhere operational cost is needed.
// Operational cost per vehicle = Σ fuel cost + Σ maintenance cost (spec 3.7).

// map { [vehicleId]: totalMaintenanceCost }
async function maintenanceCostByVehicle() {
  const rows = await prisma.maintenanceLog.groupBy({ by: ['vehicleId'], _sum: { cost: true } })
  return Object.fromEntries(rows.map((r) => [r.vehicleId, r._sum.cost || 0]))
}

// map { [vehicleId]: { cost, liters } }
async function fuelByVehicle() {
  const rows = await prisma.fuelLog.groupBy({ by: ['vehicleId'], _sum: { cost: true, liters: true } })
  return Object.fromEntries(rows.map((r) => [r.vehicleId, { cost: r._sum.cost || 0, liters: r._sum.liters || 0 }]))
}

// { byVehicle: [...], totals: { fuelTotal, maintenanceTotal, total } }
async function perVehicleSummary() {
  const [vehicles, fuelMap, maintMap] = await Promise.all([
    prisma.vehicle.findMany({ select: { id: true, slug: true, name: true, regNo: true } }),
    fuelByVehicle(),
    maintenanceCostByVehicle(),
  ])

  let fuelTotal = 0
  let maintenanceTotal = 0
  const byVehicle = vehicles.map((v) => {
    const fuelCost = fuelMap[v.id]?.cost || 0
    const fuelLiters = fuelMap[v.id]?.liters || 0
    const maintenanceCost = maintMap[v.id] || 0
    fuelTotal += fuelCost
    maintenanceTotal += maintenanceCost
    return {
      slug: v.slug,
      name: v.name,
      regNo: v.regNo,
      fuelCost,
      fuelLiters,
      maintenanceCost,
      operationalCost: fuelCost + maintenanceCost,
    }
  })

  return { byVehicle, totals: { fuelTotal, maintenanceTotal, total: fuelTotal + maintenanceTotal } }
}

module.exports = { maintenanceCostByVehicle, fuelByVehicle, perVehicleSummary }
