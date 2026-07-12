<<<<<<< HEAD
// Express bootstrap (doc 01 §4).
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const vehicleRoutes = require('./routes/vehicles');

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);

// 404 for unknown API routes.
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// Global error handler — maps ServiceError.status, defaults to 500.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`TransitOps API listening on :${PORT}`));

module.exports = app;
=======
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

// global error handler — services throw { status, message }
app.use((err, req, res, next) => {
  const status = err.status || 500
  const message = err.message || 'Internal server error'
  if (status === 500) console.error(err)
  res.status(status).json({ error: message })
})

const PORT = process.env.PORT || 5050
app.listen(PORT, () => console.log(`TransitOps API on :${PORT}`))
>>>>>>> 6db0e718af9c7de375e68fbaa07109db74c7cb65
