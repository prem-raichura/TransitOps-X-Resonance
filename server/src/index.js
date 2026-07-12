require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')

const app = express()

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'] }))
app.use(express.json())

// fuel-meter proof photos (multer writes here, see PLANS/11)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

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

const PORT = process.env.PORT || 5050
app.listen(PORT, () => console.log(`TransitOps API on :${PORT}`))
