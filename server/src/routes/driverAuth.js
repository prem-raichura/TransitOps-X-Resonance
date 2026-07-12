const router = require('express').Router()

// Stub — implement per the matching PLANS/ doc
router.all('*', (req, res) => res.status(501).json({ error: 'Not implemented yet — see PLANS/' }))

module.exports = router
