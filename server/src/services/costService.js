const prisma = require('../lib/prisma')

// Operational cost per vehicle = Σ fuel cost + Σ maintenance cost (spec 3.7).
// Shared by Fuel/Expenses (07) and Analytics (09) — single source of truth.
async function operationalCostByVehicle() {
  const [vehicles, fuel, maint] = await Promise.all([
    prisma.vehicle.findMany({ select: { id: true, slug: true, name: true, regNo: true } }),
    prisma.fuelLog.groupBy({ by: ['vehicleId'], _sum: { cost: true, liters: true } }),
    prisma.maintenanceLog.groupBy({ by: ['vehicleId'], _sum: { cost: true } }),
  ])

  const fuelMap = Object.fromEntries(fuel.map((f) => [f.vehicleId, f._sum]))
  const maintMap = Object.fromEntries(maint.map((m) => [m.vehicleId, m._sum.cost || 0]))

  return vehicles.map((v) => {
    const fuelCost = fuelMap[v.id]?.cost || 0
    const fuelLiters = fuelMap[v.id]?.liters || 0
    const maintCost = maintMap[v.id] || 0
    return {
      slug: v.slug,
      name: v.name,
      regNo: v.regNo,
      fuelCost,
      fuelLiters,
      maintenanceCost: maintCost,
      operationalCost: fuelCost + maintCost,
    }
  })
}

async function totalOperationalCost() {
  const [fuel, maint] = await Promise.all([
    prisma.fuelLog.aggregate({ _sum: { cost: true } }),
    prisma.maintenanceLog.aggregate({ _sum: { cost: true } }),
  ])
  const fuelTotal = fuel._sum.cost || 0
  const maintTotal = maint._sum.cost || 0
  return { fuelTotal, maintenanceTotal: maintTotal, total: fuelTotal + maintTotal }
}

module.exports = { operationalCostByVehicle, totalOperationalCost }
