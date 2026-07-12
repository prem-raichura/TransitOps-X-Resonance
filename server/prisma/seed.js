// Seed (doc 01 §3). Scoped here to what flow 03 needs: 4 role users + mockup vehicles.
// Drivers/trips seeding belongs to docs 04/05.
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { slugify } = require('../src/services/slugService');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('demo1234', 10);

  const users = [
    { name: 'Fleet Manager', email: 'manager@transitops.in', role: 'FLEET_MANAGER' },
    { name: 'Dispatcher', email: 'dispatch@transitops.in', role: 'DISPATCHER' },
    { name: 'Safety Officer', email: 'safety@transitops.in', role: 'SAFETY_OFFICER' },
    { name: 'Financial Analyst', email: 'finance@transitops.in', role: 'FINANCIAL_ANALYST' },
  ];
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, passwordHash, failedLogins: 0, lockedUntil: null },
      create: { ...u, passwordHash },
    });
  }

  // Vehicles match mockup screen 2. Keyed on slug so re-seeding stays idempotent.
  const vehicles = [
    { regNo: 'GJ01AB1521', name: 'VAN-05', type: 'VAN', capacityKg: 500, odometer: 42000, acquisitionCost: 850000, region: 'Gandhinagar', status: 'AVAILABLE' },
    { regNo: 'GJ01CD9981', name: 'TRK-12', type: 'TRUCK', capacityKg: 5000, odometer: 118000, acquisitionCost: 2400000, region: 'Ahmedabad', status: 'AVAILABLE' },
    { regNo: 'GJ01EF4410', name: 'TRUCK-11', type: 'TRUCK', capacityKg: 5000, odometer: 96000, acquisitionCost: 2350000, region: 'Ahmedabad', status: 'ON_TRIP' },
    { regNo: 'GJ01GH8120', name: 'MINI-03', type: 'MINI', capacityKg: 1000, odometer: 30500, acquisitionCost: 620000, region: 'Gandhinagar', status: 'IN_SHOP' },
    { regNo: 'GJ01BC0089', name: 'VAN-09', type: 'VAN', capacityKg: 950, odometer: 210000, acquisitionCost: 780000, region: 'Surat', status: 'RETIRED' },
  ];
  for (const v of vehicles) {
    const slug = slugify(v.name);
    await prisma.vehicle.upsert({
      where: { slug },
      update: v,
      create: { ...v, slug },
    });
  }

  console.log('Seed complete: %d users, %d vehicles', users.length, vehicles.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
