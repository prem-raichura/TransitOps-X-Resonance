require('dotenv').config()
const express = require('express')
const cors = require('cors')

const app = express()

// local dev origins + any deployed client origins from env (comma-separated)
const origins = ['http://localhost:5173', 'http://localhost:5174']
if (process.env.CLIENT_ORIGINS) origins.push(...process.env.CLIENT_ORIGINS.split(','))
app.use(cors({ origin: origins }))
app.use(express.json())

// Fuel-meter proof photos live on Cloudinary (src/lib/cloudinary.js) — no local uploads dir.
// Local disk is ephemeral/read-only on Vercel serverless.

app.get('/', (req, res) =>
  res.json({ service: 'TransitOps API', status: 'running', health: '/api/health' }),
)
app.get('/api/health', (req, res) => res.json({ ok: true, service: 'transitops-api' }))

// Module routers — implemented per PLANS/02-09, 11-12
app.use('/api/auth', require('./routes/auth'))
app.use('/api/vehicles', require('./routes/vehicles'))
app.use('/api/drivers', require('./routes/drivers'))
app.use('/api/trips', require('./routes/trips'))
app.use('/api/maintenance', require('./routes/maintenance'))
app.use('/api/fuel', require('./routes/fuel'))
app.use('/api/expenses', require('./routes/expenses'))
app.use('/api/dashboard', require('./routes/dashboard'))
app.use('/api/analytics', require('./routes/analytics'))
app.use('/api/settings', require('./routes/settings'))
app.use('/api/staff', require('./routes/staff'))
app.use('/api/driver-auth', require('./routes/driverAuth'))
app.use('/api/driver', require('./routes/driverApp'))
app.use('/api/tracking', require('./routes/tracking'))

// 404 for unknown API routes
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }))

// global error handler — services throw { status, message } (ServiceError included)
app.use((err, req, res, next) => {
  const status = err.status || 500
  const message = err.message || 'Internal server error'
  if (status >= 500) console.error(err)
  res.status(status).json({ error: message })
})

// On Vercel the app runs as a serverless function — export it, never listen.
// Locally (node/nodemon) we listen as usual.
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5050
  app.listen(PORT, () => console.log(`TransitOps API on :${PORT}`))
}

module.exports = app
