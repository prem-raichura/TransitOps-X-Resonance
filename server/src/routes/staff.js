// Staff management — Fleet Manager can create / list / delete web-app user accounts.
// These are the staff who log into the web dashboard (Dispatcher, Safety Officer, Financial Analyst).
// Fleet Manager accounts can only be created via seed/migration, not via this API.
const router = require('express').Router()
const bcrypt = require('bcryptjs')
const prisma = require('../lib/prisma')
const { requireAuth } = require('../middleware/auth')
const { requireRole } = require('../middleware/rbac')

// Roles that Fleet Manager is allowed to create / manage
const MANAGEABLE_ROLES = ['DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST']

router.use(requireAuth, requireRole('FLEET_MANAGER'))

// GET /api/staff — list all non-FLEET_MANAGER users
router.get('/', async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: { in: MANAGEABLE_ROLES } },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })
    res.json(users)
  } catch (err) {
    next(err)
  }
})

// POST /api/staff — create a new staff user { name, email, password, role }
router.post('/', async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body || {}

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'name, email, password and role are required' })
    }
    if (!MANAGEABLE_ROLES.includes(role)) {
      return res.status(400).json({ error: `Role must be one of: ${MANAGEABLE_ROLES.join(', ')}` })
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
    if (existing) return res.status(409).json({ error: 'Email already registered' })

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { name: name.trim(), email: email.toLowerCase().trim(), passwordHash, role },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })
    res.status(201).json(user)
  } catch (err) {
    next(err)
  }
})

// DELETE /api/staff/:id — remove a staff user (cannot delete Fleet Managers)
router.delete('/:id', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!user) return res.status(404).json({ error: 'User not found' })
    if (!MANAGEABLE_ROLES.includes(user.role)) {
      return res.status(403).json({ error: 'Cannot delete Fleet Manager accounts via this API' })
    }
    await prisma.user.delete({ where: { id: req.params.id } })
    res.json({ deleted: true })
  } catch (err) {
    next(err)
  }
})

module.exports = router
