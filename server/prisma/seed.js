const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('demo1234', 10)

  // 4 staff users — one per role
  await prisma.user.createMany({
    data: [
      { name: 'Meera K.', email: 'manager@transitops.in', passwordHash, role: 'FLEET_MANAGER' },
      { name: 'Raven K.', email: 'dispatch@transitops.in', passwordHash, role: 'DISPATCHER' },
      { name: 'Sana P.', email: 'safety@transitops.in', passwordHash, role: 'SAFETY_OFFICER' },
      { name: 'Farid A.', email: 'finance@transitops.in', passwordHash, role: 'FINANCIAL_ANALYST' },
    ],
    skipDuplicates: true,
  })

  // Vehicles (mockup data)
  const van05 = await prisma.vehicle.create({
    data: { slug: 'van-05', regNo: 'GJ01AB1521', name: 'VAN-05', type: 'VAN', capacityKg: 500, odometer: 74000, acquisitionCost: 620000, region: 'Gandhinagar', status: 'AVAILABLE' },
  })
  const trk12 = await prisma.vehicle.create({
    data: { slug: 'trk-12', regNo: 'GJ01CD9981', name: 'TRK-12', type: 'TRUCK', capacityKg: 5000, odometer: 182000, acquisitionCost: 2450000, region: 'Ahmedabad', status: 'AVAILABLE' },
  })
  const truck11 = await prisma.vehicle.create({
    data: { slug: 'truck-11', regNo: 'GJ01EF4410', name: 'TRUCK-11', type: 'TRUCK', capacityKg: 5000, odometer: 96000, acquisitionCost: 2100000, region: 'Ahmedabad', status: 'AVAILABLE' },
  })
  await prisma.vehicle.create({
    data: { slug: 'mini-03', regNo: 'GJ01GH8120', name: 'MINI-03', type: 'MINI', capacityKg: 1000, odometer: 66000, acquisitionCost: 410000, region: 'Gandhinagar', status: 'IN_SHOP' },
  })
  await prisma.vehicle.create({
    data: { slug: 'van-09', regNo: 'GJ01BC0089', name: 'VAN-09', type: 'VAN', capacityKg: 950, odometer: 241900, acquisitionCost: 540000, region: 'Kalol', status: 'RETIRED' },
  })

  // Drivers — Alex valid, Joan expired license (blocked demo), Suresh suspended (blocked demo)
  const driverPassword = await bcrypt.hash('driver1234', 10)
  const alex = await prisma.driver.create({
    data: {
      slug: 'alex', name: 'Alex', licenseNo: 'DL-88213', licenseCategory: 'LMV',
      licenseExpiry: new Date('2028-12-31'), contact: '9876500001', safetyScore: 96,
      status: 'AVAILABLE', phone: '9876500001', passwordHash: driverPassword,
    },
  })
  await prisma.driver.create({
    data: {
      slug: 'joan', name: 'Joan', licenseNo: 'DL-44120', licenseCategory: 'HMV',
      licenseExpiry: new Date('2025-03-31'), contact: '9822000002', safetyScore: 87, status: 'AVAILABLE',
    },
  })
  const priya = await prisma.driver.create({
    data: {
      slug: 'priya', name: 'Priya', licenseNo: 'DL-77031', licenseCategory: 'LMV',
      licenseExpiry: new Date('2027-08-31'), contact: '9910000003', safetyScore: 99, status: 'AVAILABLE',
    },
  })
  await prisma.driver.create({
    data: {
      slug: 'suresh', name: 'Suresh', licenseNo: 'DL-90045', licenseCategory: 'HMV',
      licenseExpiry: new Date('2027-01-31'), contact: '9440000004', safetyScore: 88, status: 'SUSPENDED',
    },
  })

  // Completed trips with fuel + expenses so analytics show numbers on demo day
  const trip1 = await prisma.trip.create({
    data: {
      slug: 'tr-001', source: 'Gandhinagar Depot', destination: 'Ahmedabad Hub',
      vehicleId: van05.id, driverId: alex.id, cargoKg: 450, plannedKm: 38,
      status: 'COMPLETED', startOdometer: 73950, endOdometer: 74000, revenue: 12000,
      dispatchedAt: new Date('2026-07-05T08:00:00Z'), completedAt: new Date('2026-07-05T10:30:00Z'),
      completedBy: 'DISPATCHER',
    },
  })
  const trip2 = await prisma.trip.create({
    data: {
      slug: 'tr-002', source: 'Vatva Industrial Area', destination: 'Sanand Warehouse',
      vehicleId: trk12.id, driverId: priya.id, cargoKg: 3800, plannedKm: 52,
      status: 'COMPLETED', startOdometer: 181940, endOdometer: 182000, revenue: 26000,
      dispatchedAt: new Date('2026-07-06T07:00:00Z'), completedAt: new Date('2026-07-06T11:00:00Z'),
      completedBy: 'DISPATCHER',
    },
  })
  await prisma.trip.create({
    data: {
      slug: 'tr-003', source: 'Mansa', destination: 'Kalol Depot',
      vehicleId: truck11.id, driverId: priya.id, cargoKg: 2000, plannedKm: 30,
      status: 'CANCELLED',
    },
  })

  // Fuel logs
  await prisma.fuelLog.createMany({
    data: [
      { vehicleId: van05.id, tripId: trip1.id, liters: 42, cost: 3150, date: new Date('2026-07-05'), loggedBy: 'AUTO' },
      { vehicleId: trk12.id, tripId: trip2.id, liters: 110, cost: 8400, date: new Date('2026-07-06'), loggedBy: 'AUTO' },
      { vehicleId: van05.id, liters: 28, cost: 2050, date: new Date('2026-07-08'), loggedBy: 'ANALYST' },
    ],
  })

  // Expenses
  await prisma.expense.createMany({
    data: [
      { tripId: trip1.id, tollCost: 120, miscCost: 0 },
      { tripId: trip2.id, tollCost: 340, miscCost: 150 },
    ],
  })

  // Maintenance — MINI-03 currently in shop + one completed record
  await prisma.maintenanceLog.createMany({
    data: [
      { slug: 'mnt-001', vehicleId: (await prisma.vehicle.findUnique({ where: { slug: 'mini-03' } })).id, serviceType: 'Tyre Replace', cost: 6200, date: new Date('2026-07-10'), status: 'IN_SHOP' },
      { slug: 'mnt-002', vehicleId: truck11.id, serviceType: 'Engine Repair', cost: 18000, date: new Date('2026-06-28'), status: 'COMPLETED' },
      { slug: 'mnt-003', vehicleId: van05.id, serviceType: 'Oil Change', cost: 2500, date: new Date('2026-06-15'), status: 'COMPLETED' },
    ],
  })

  // Depot settings (single row)
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  })

  console.log('Seed complete: 4 users, 5 vehicles, 4 drivers, 3 trips, fuel/expenses/maintenance, settings')
  console.log('Staff login: *@transitops.in / demo1234 · Driver app: 9876500001 / driver1234 (Alex)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
