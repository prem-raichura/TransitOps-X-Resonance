// Fuel & Expense API calls (doc 07).
import api from './client'

export const listFuel = () => api.get('/fuel').then((r) => r.data)
export const createFuel = (body) => api.post('/fuel', body).then((r) => r.data)

export const listExpenses = () => api.get('/expenses').then((r) => r.data)
export const createExpense = (body) => api.post('/expenses', body).then((r) => r.data)
export const expenseSummary = () => api.get('/expenses/summary').then((r) => r.data)
export const tripOptions = () => api.get('/expenses/trips').then((r) => r.data)
