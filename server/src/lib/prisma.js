const { PrismaClient } = require('@prisma/client')

// single shared client — nodemon restarts get a fresh process, no pooling issues
const prisma = new PrismaClient()

module.exports = prisma
