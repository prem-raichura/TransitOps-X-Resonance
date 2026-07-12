// Vehicle API calls (doc 03).
import api from './client';

export const listVehicles = (params) =>
  api.get('/vehicles', { params }).then((r) => r.data);

export const listAvailableVehicles = () =>
  api.get('/vehicles/available').then((r) => r.data);

export const createVehicle = (body) =>
  api.post('/vehicles', body).then((r) => r.data);

export const updateVehicle = (slug, body) =>
  api.put(`/vehicles/${slug}`, body).then((r) => r.data);

export const deleteVehicle = (slug) =>
  api.delete(`/vehicles/${slug}`).then((r) => r.data);
