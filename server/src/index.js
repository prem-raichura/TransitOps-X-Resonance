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
