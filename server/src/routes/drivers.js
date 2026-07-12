const router = require('express').Router()
const bcrypt = require('bcryptjs')
const prisma = require('../lib/prisma')
const { requireAuth } = require('../middleware/auth')
const { requireRole } = require('../middleware/rbac')

const slugify = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

async function uniqueSlug(base) {
  let slug = base
  let n = 2
  // eslint-disable-next-line no-await-in-loop
  while (await prisma.driver.findUnique({ where: { slug } })) {
    slug = `${base}-${n}`
    n += 1
  }
  return slug
}

const withComputed = (driver) => ({
  ...driver,
  licenseExpired: driver.licenseExpiry < new Date(),
})

// GET /api/drivers?status=&search= — any authenticated role
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { status, search } = req.query
    const where = {
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { licenseNo: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    }
    const drivers = await prisma.driver.findMany({ where, orderBy: { createdAt: 'asc' } })
    res.json(drivers.map(withComputed))
  } catch (err) {
    next(err)
  }
})

// GET /api/drivers/available — assignment pool (Rules 3, 4): AVAILABLE + license not expired
router.get('/available', requireAuth, async (req, res, next) => {
  try {
    const drivers = await prisma.driver.findMany({
      where: { status: 'AVAILABLE', licenseExpiry: { gt: new Date() } },
      orderBy: { name: 'asc' },
    })
    res.json(drivers.map(withComputed))
  } catch (err) {
    next(err)
  }
})

// POST /api/drivers — Safety Officer, Fleet Manager
router.post('/', requireAuth, requireRole('SAFETY_OFFICER', 'FLEET_MANAGER'), async (req, res, next) => {
  try {
    const { name, licenseNo, licenseCategory, licenseExpiry, contact } = req.body
    if (!name || !licenseNo || !licenseCategory || !licenseExpiry || !contact) {
      return res.status(400).json({ error: 'name, licenseNo, licenseCategory, licenseExpiry, contact are required' })
    }

    const existing = await prisma.driver.findUnique({ where: { licenseNo } })
    if (existing) return res.status(409).json({ error: 'License number already registered' })

    const slug = await uniqueSlug(slugify(name))
    const driver = await prisma.driver.create({
      data: { slug, name, licenseNo, licenseCategory, licenseExpiry: new Date(licenseExpiry), contact },
    })
    res.status(201).json(withComputed(driver))
  } catch (err) {
    next(err)
  }
})

// PUT /api/drivers/:slug — Safety Officer, Fleet Manager. Includes status toggle (not ON_TRIP — system-managed)
router.put('/:slug', requireAuth, requireRole('SAFETY_OFFICER', 'FLEET_MANAGER'), async (req, res, next) => {
  try {
    const driver = await prisma.driver.findUnique({ where: { slug: req.params.slug } })
    if (!driver) return res.status(404).json({ error: 'Driver not found' })

    const { name, licenseCategory, licenseExpiry, contact, status } = req.body

    if (status && status === 'ON_TRIP') {
      return res.status(400).json({ error: 'ON_TRIP is system-managed and cannot be set manually' })
    }
    if (status && !['AVAILABLE', 'OFF_DUTY', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    const updated = await prisma.driver.update({
      where: { slug: req.params.slug },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(licenseCategory !== undefined ? { licenseCategory } : {}),
        ...(licenseExpiry !== undefined ? { licenseExpiry: new Date(licenseExpiry) } : {}),
        ...(contact !== undefined ? { contact } : {}),
        ...(status !== undefined ? { status } : {}),
      },
    })
    res.json(withComputed(updated))
  } catch (err) {
    next(err)
  }
})

// POST /api/drivers/:slug/credentials — Dispatcher only (doc 11: driver app login provisioning)
router.post('/:slug/credentials', requireAuth, requireRole('DISPATCHER'), async (req, res, next) => {
  try {
    const { phone, password } = req.body
    if (!phone || !password) return res.status(400).json({ error: 'phone and password are required' })

    const driver = await prisma.driver.findUnique({ where: { slug: req.params.slug } })
    if (!driver) return res.status(404).json({ error: 'Driver not found' })

    const phoneTaken = await prisma.driver.findFirst({ where: { phone, NOT: { id: driver.id } } })
    if (phoneTaken) return res.status(409).json({ error: 'Phone number already in use' })

    const passwordHash = await bcrypt.hash(password, 10)
    const updated = await prisma.driver.update({
      where: { slug: req.params.slug },
      data: { phone, passwordHash },
    })
    res.json(withComputed(updated))
  } catch (err) {
    next(err)
  }
})

module.exports = router
