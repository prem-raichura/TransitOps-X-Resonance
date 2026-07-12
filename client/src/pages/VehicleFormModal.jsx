// Add/Edit vehicle modal (doc 03). Surfaces server duplicate-regNo error inline.
import { useState } from 'react';
import Modal from '../components/Modal';
import { createVehicle, updateVehicle } from '../api/vehicles';

const TYPES = ['VAN', 'TRUCK', 'MINI'];
const STATUSES = ['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED'];

const EMPTY = {
  regNo: '',
  name: '',
  type: 'VAN',
  capacityKg: '',
  odometer: '',
  acquisitionCost: '',
  region: '',
  status: 'AVAILABLE',
};

export default function VehicleFormModal({ open, onClose, onSaved, vehicle }) {
  const isEdit = Boolean(vehicle);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [regNoError, setRegNoError] = useState('');
  const [busy, setBusy] = useState(false);

  // Reset form whenever the modal opens (create=empty, edit=prefill).
  const [seededFor, setSeededFor] = useState(null);
  const key = vehicle?.slug || 'new';
  if (open && seededFor !== key) {
    setForm(
      vehicle
        ? {
            regNo: vehicle.regNo,
            name: vehicle.name,
            type: vehicle.type,
            capacityKg: String(vehicle.capacityKg),
            odometer: String(vehicle.odometer),
            acquisitionCost: String(vehicle.acquisitionCost),
            region: vehicle.region || '',
            status: vehicle.status,
          }
        : EMPTY
    );
    setError('');
    setRegNoError('');
    setSeededFor(key);
  }

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (field === 'regNo') setRegNoError('');
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setRegNoError('');
    setBusy(true);

    const payload = {
      regNo: form.regNo.trim(),
      name: form.name.trim(),
      type: form.type,
      capacityKg: Number(form.capacityKg),
      odometer: form.odometer === '' ? 0 : Number(form.odometer),
      acquisitionCost: Number(form.acquisitionCost),
      region: form.region.trim() || null,
      status: form.status,
    };

    try {
      const saved = isEdit
        ? await updateVehicle(vehicle.slug, payload)
        : await createVehicle(payload);
      setSeededFor(null); // force re-seed next open
      onSaved(saved);
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.error || 'Save failed';
      if (status === 409) {
        setRegNoError(msg); // "Registration No. must be unique" — inline under field
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  }

  function close() {
    setSeededFor(null);
    onClose();
  }

  const input =
    'mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none';

  return (
    <Modal open={open} onClose={close} title={isEdit ? 'Edit Vehicle' : 'Add Vehicle'}>
      {error && (
        <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700">Registration No.</label>
            <input
              value={form.regNo}
              onChange={(e) => set('regNo', e.target.value)}
              className={`${input} ${regNoError ? 'border-red-400' : ''}`}
              required
            />
            {regNoError && <p className="mt-1 text-xs text-red-600">{regNoError}</p>}
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700">Name / Model</label>
            <input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className={input}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Type</label>
            <select value={form.type} onChange={(e) => set('type', e.target.value)} className={input}>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Status</label>
            <select
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
              className={input}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Capacity (kg)</label>
            <input
              type="number"
              min="1"
              step="any"
              value={form.capacityKg}
              onChange={(e) => set('capacityKg', e.target.value)}
              className={input}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Odometer (km)</label>
            <input
              type="number"
              min="0"
              step="any"
              value={form.odometer}
              onChange={(e) => set('odometer', e.target.value)}
              className={input}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Acquisition Cost (₹)</label>
            <input
              type="number"
              min="0"
              step="any"
              value={form.acquisitionCost}
              onChange={(e) => set('acquisitionCost', e.target.value)}
              className={input}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Region</label>
            <input
              value={form.region}
              onChange={(e) => set('region', e.target.value)}
              className={input}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={close}
            className="rounded-md border px-4 py-2 text-sm hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Add vehicle'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
