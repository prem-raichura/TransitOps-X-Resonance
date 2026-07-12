<<<<<<< HEAD
// Auth (doc 02). Minimal login + me needed to exercise vehicle RBAC. Lockout per mockup.
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
const auth = require('../middleware/auth');

const router = express.Router();

const MAX_FAILED = 5;
const LOCK_MINUTES = 15;

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return res.status(403).json({ error: 'Account locked after 5 failed attempts' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      const failedLogins = user.failedLogins + 1;
      const lockedUntil =
        failedLogins >= MAX_FAILED ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null;
      await prisma.user.update({ where: { id: user.id }, data: { failedLogins, lockedUntil } });
      if (lockedUntil) {
        return res.status(403).json({ error: 'Account locked after 5 failed attempts' });
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Success — reset counters.
    if (user.failedLogins !== 0 || user.lockedUntil) {
      await prisma.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null } });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '8h',
    });
    res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user.id, name: user.name, role: user.role });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
=======
const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../lib/prisma')
const { requireAuth } = require('../middleware/auth')

const MAX_FAILED_LOGINS = 5
const LOCK_MINUTES = 15
const TOKEN_EXPIRY = '8h'

// POST /api/auth/login { email, password, role? }
router.post('/login', async (req, res, next) => {
  try {
    const { email, password, role } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return res.status(403).json({ error: `Account locked after ${MAX_FAILED_LOGINS} failed attempts. Try again later.` })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      const failedLogins = user.failedLogins + 1
      const locked = failedLogins >= MAX_FAILED_LOGINS
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLogins: locked ? 0 : failedLogins,
          lockedUntil: locked ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000) : null,
        },
      })
      if (locked) {
        return res.status(403).json({ error: `Account locked after ${MAX_FAILED_LOGINS} failed attempts. Try again later.` })
      }
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // login form's role dropdown must match the account's assigned role (mockup screen 0)
    if (role && role !== user.role) {
      return res.status(403).json({ error: 'Role mismatch — select your assigned role' })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { failedLogins: 0, lockedUntil: null },
    })

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY })
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
  } catch (err) {
    next(err)
  }
})

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true },
    })
    if (!user) return res.status(401).json({ error: 'User no longer exists' })
    res.json({ user })
  } catch (err) {
    next(err)
  }
})

module.exports = router
>>>>>>> 6db0e718af9c7de375e68fbaa07109db74c7cb65
