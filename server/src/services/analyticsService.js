const prisma = require('../lib/prisma')

// services throw { status, message } — caught by global error handler in index.js
const fail = (status, message) => {
  const e = new Error(message)
  e.status = status
  throw e
}

const round1 = (n) => Math.round(n * 10) / 10

// trip distance = odometer delta when both present, else planned km (plan §1)
const distanceOf = (t) =>
  t.startOdometer != null && t.endOdometer != null && t.endOdometer >= t.startOdometer
    ? t.endOdometer - t.startOdometer
    : t.plannedKm || 0

// per-vehicle fuel + maintenance + completed-trip revenue (operational cost = fuel + maintenance)
async function vehicleCostRows() {
  const vehicles = await prisma.vehicle.findMany({
    include: {
      maintenance: true,
      fuelLogs: true,
      trips: { where: { status: 'COMPLETED' } },
    },
    orderBy: { name: 'asc' },
  })
  return vehicles.map((v) => {
    const maintenance = v.maintenance.reduce((s, m) => s + m.cost, 0)
    const fuel = v.fuelLogs.reduce((s, f) => s + f.cost, 0)
    const revenue = v.trips.reduce((s, t) => s + (t.revenue || 0), 0)
    const cost = maintenance + fuel
    const roi = v.acquisitionCost > 0 ? ((revenue - cost) / v.acquisitionCost) * 100 : null
    return { vehicle: v, maintenance, fuel, revenue, cost, roi }
  })
}

// 4 KPI cards
async function summary() {
  const [rows, trips, fuelAgg, vehicles] = await Promise.all([
    vehicleCostRows(),
    prisma.trip.findMany({
      where: { status: 'COMPLETED' },
      select: { startOdometer: true, endOdometer: true, plannedKm: true },
    }),
    prisma.fuelLog.aggregate({ _sum: { liters: true } }),
    prisma.vehicle.findMany({ select: { status: true } }),
  ])

  const distance = trips.reduce((s, t) => s + distanceOf(t), 0)
  const liters = fuelAgg._sum.liters || 0
  const fuelEfficiency = liters > 0 ? distance / liters : 0

  const nonRetired = vehicles.filter((v) => v.status !== 'RETIRED').length
  const onTrip = vehicles.filter((v) => v.status === 'ON_TRIP').length
  const fleetUtilization = nonRetired > 0 ? (onTrip / nonRetired) * 100 : 0

  const operationalCost = rows.reduce((s, r) => s + r.cost, 0)

  const roiRows = rows.filter((r) => r.roi != null)
  const avgRoi = roiRows.length ? roiRows.reduce((s, r) => s + r.roi, 0) / roiRows.length : 0

  return {
    fuelEfficiency: round1(fuelEfficiency),
    fleetUtilization: Math.round(fleetUtilization),
    operationalCost: Math.round(operationalCost),
    avgRoi: round1(avgRoi),
  }
}

// Σ revenue grouped by month, completed trips
async function monthlyRevenue() {
  const trips = await prisma.trip.findMany({
    where: { status: 'COMPLETED' },
    select: { revenue: true, completedAt: true, createdAt: true },
  })
  const map = new Map() // key "YYYY-MM" -> { label, revenue }
  for (const t of trips) {
    const d = t.completedAt || t.createdAt
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleString('en-US', { month: 'short' })
    const cur = map.get(key) || { label, revenue: 0 }
    cur.revenue += t.revenue || 0
    map.set(key, cur)
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => ({ month: v.label, revenue: Math.round(v.revenue) }))
}

// operational cost per vehicle desc, top 3
async function costliestVehicles() {
  const rows = await vehicleCostRows()
  return rows
    .filter((r) => r.cost > 0)
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 3)
    .map((r) => ({ vehicle: r.vehicle.name, cost: Math.round(r.cost) }))
}

// --- CSV export (no library — plan §2) ---
const esc = (v) => {
  const s = v == null ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
const toCsv = (header, rows) => [header, ...rows].map((r) => r.map(esc).join(',')).join('\n')

const REPORTS = {
  trips: async () => {
    const trips = await prisma.trip.findMany({
      include: { vehicle: true, driver: true },
      orderBy: { createdAt: 'asc' },
    })
    const header = ['Trip', 'Source', 'Destination', 'Vehicle', 'Driver', 'Status', 'Cargo Kg', 'Planned Km', 'Revenue', 'Completed At']
    const rows = trips.map((t) => [
      t.slug, t.source, t.destination, t.vehicle.name, t.driver.name, t.status,
      t.cargoKg, t.plannedKm, t.revenue, t.completedAt ? t.completedAt.toISOString() : '',
    ])
    return toCsv(header, rows)
  },
  fuel: async () => {
    const logs = await prisma.fuelLog.findMany({ include: { vehicle: true }, orderBy: { date: 'asc' } })
    const header = ['Vehicle', 'Liters', 'Cost', 'Date', 'Logged By']
    const rows = logs.map((f) => [f.vehicle.name, f.liters, f.cost, f.date.toISOString(), f.loggedBy])
    return toCsv(header, rows)
  },
  expenses: async () => {
    const exp = await prisma.expense.findMany({ include: { trip: true }, orderBy: { date: 'asc' } })
    const header = ['Trip', 'Toll Cost', 'Misc Cost', 'Total', 'Date']
    const rows = exp.map((e) => [e.trip.slug, e.tollCost, e.miscCost, e.tollCost + e.miscCost, e.date.toISOString()])
    return toCsv(header, rows)
  },
  vehicles: async () => {
    const rows = await vehicleCostRows()
    const header = ['Vehicle', 'Reg No', 'Type', 'Status', 'Acquisition Cost', 'Fuel Cost', 'Maintenance Cost', 'Operational Cost', 'Revenue', 'ROI %']
    const out = rows.map((r) => [
      r.vehicle.name, r.vehicle.regNo, r.vehicle.type, r.vehicle.status, r.vehicle.acquisitionCost,
      Math.round(r.fuel), Math.round(r.maintenance), Math.round(r.cost), Math.round(r.revenue),
      r.roi != null ? round1(r.roi) : '',
    ])
    return toCsv(header, out)
  },
}

async function exportCsv(report) {
  const build = REPORTS[report]
  if (!build) fail(400, `Unknown report: ${report}`)
  const csv = await build()
  return { filename: `${report}-report.csv`, csv }
}

module.exports = { summary, monthlyRevenue, costliestVehicles, exportCsv }
