// Vehicle business logic (doc 03). All validation + status rules live here; routes stay thin.
const prisma = require('../prisma');
const { generateUniqueSlug } = require('./slugService');

const VEHICLE_TYPES = ['VAN', 'TRUCK', 'MINI'];
const VEHICLE_STATUSES = ['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED'];

// Thrown for expected, client-facing failures. index.js error handler maps .status.
class ServiceError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Rule 1 friendly message (mockup footnote).
const DUP_REGNO_MSG = 'Registration No. must be unique';

function validate(input, { partial = false } = {}) {
  const errors = [];
  const has = (k) => input[k] !== undefined && input[k] !== null && input[k] !== '';

  if (!partial || has('regNo')) {
    if (!has('regNo')) errors.push('regNo is required');
  }
  if (!partial || has('name')) {
    if (!has('name')) errors.push('name is required');
  }
  if (!partial || has('type')) {
    if (!VEHICLE_TYPES.includes(input.type)) errors.push(`type must be one of ${VEHICLE_TYPES.join(', ')}`);
  }
  if (!partial || has('capacityKg')) {
    if (!(Number(input.capacityKg) > 0)) errors.push('capacityKg must be greater than 0');
  }
  if (!partial || has('acquisitionCost')) {
    if (!(Number(input.acquisitionCost) >= 0)) errors.push('acquisitionCost must be >= 0');
  }
  if (has('odometer') && !(Number(input.odometer) >= 0)) {
    errors.push('odometer must be >= 0');
  }
  if (has('status') && !VEHICLE_STATUSES.includes(input.status)) {
    errors.push(`status must be one of ${VEHICLE_STATUSES.join(', ')}`);
  }

  if (errors.length) throw new ServiceError(400, errors.join('; '));
}

// GET /api/vehicles — filters: type, status, search (regNo|name), region
async function list({ type, status, search, region } = {}) {
  const where = {};
  if (type) where.type = type;
  if (status) where.status = status;
  if (region) where.region = region;
  if (search) {
    where.OR = [
      { regNo: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
    ];
  }
  return prisma.vehicle.findMany({ where, orderBy: { createdAt: 'desc' } });
}

// GET /api/vehicles/available — Rules 2 & 4: dispatch pool is AVAILABLE only.
async function listAvailable() {
  return prisma.vehicle.findMany({
    where: { status: 'AVAILABLE' },
    orderBy: { name: 'asc' },
  });
}

async function getBySlug(slug) {
  const vehicle = await prisma.vehicle.findUnique({ where: { slug } });
  if (!vehicle) throw new ServiceError(404, 'Vehicle not found');
  return vehicle;
}

async function create(input) {
  validate(input);
  const slug = await generateUniqueSlug(prisma.vehicle, input.name);
  try {
    return await prisma.vehicle.create({
      data: {
        slug,
        regNo: input.regNo.trim(),
        name: input.name.trim(),
        type: input.type,
        capacityKg: Number(input.capacityKg),
        odometer: input.odometer !== undefined ? Number(input.odometer) : 0,
        acquisitionCost: Number(input.acquisitionCost),
        region: input.region ? String(input.region).trim() : null,
        status: input.status || 'AVAILABLE',
      },
    });
  } catch (err) {
    throw mapPrismaError(err);
  }
}

async function update(slug, input) {
  const existing = await getBySlug(slug);
  validate(input, { partial: true });

  const data = {};
  if (input.regNo !== undefined) data.regNo = input.regNo.trim();
  if (input.type !== undefined) data.type = input.type;
  if (input.capacityKg !== undefined) data.capacityKg = Number(input.capacityKg);
  if (input.odometer !== undefined) data.odometer = Number(input.odometer);
  if (input.acquisitionCost !== undefined) data.acquisitionCost = Number(input.acquisitionCost);
  if (input.region !== undefined) data.region = input.region ? String(input.region).trim() : null;
  if (input.status !== undefined) data.status = input.status;
  // Rename regenerates the slug (kept unique, excluding self).
  if (input.name !== undefined && input.name.trim() !== existing.name) {
    data.name = input.name.trim();
    data.slug = await generateUniqueSlug(prisma.vehicle, input.name, existing.id);
  }

  try {
    return await prisma.vehicle.update({ where: { slug }, data });
  } catch (err) {
    throw mapPrismaError(err);
  }
}

// DELETE — soft: if the vehicle has trips, retire it instead of hard-deleting (doc 03).
async function remove(slug) {
  const vehicle = await getBySlug(slug);
  const tripCount = await prisma.trip.count({ where: { vehicleId: vehicle.id } });

  if (tripCount > 0) {
    const retired = await prisma.vehicle.update({
      where: { slug },
      data: { status: 'RETIRED' },
    });
    return { softDeleted: true, vehicle: retired };
  }

  await prisma.vehicle.delete({ where: { slug } });
  return { softDeleted: false };
}

// Translate Prisma unique-constraint violation on regNo into a friendly 409 (Rule 1).
function mapPrismaError(err) {
  if (err.code === 'P2002' && err.meta?.target?.includes?.('regNo')) {
    return new ServiceError(409, DUP_REGNO_MSG);
  }
  return err;
}

module.exports = {
  ServiceError,
  DUP_REGNO_MSG,
  VEHICLE_TYPES,
  VEHICLE_STATUSES,
  list,
  listAvailable,
  getBySlug,
  create,
  update,
  remove,
};
