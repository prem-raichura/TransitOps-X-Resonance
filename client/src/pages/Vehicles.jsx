// Vehicle Registry (doc 03, mockup screen 2). Table + filters + role-gated add/edit/delete.
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { listVehicles, deleteVehicle } from '../api/vehicles';
import StatusBadge from '../components/StatusBadge';
import { TableSkeleton } from '../components/Skeleton';
import VehicleFormModal from './VehicleFormModal';

const TYPE_OPTIONS = [
  ['', 'All Types'],
  ['VAN', 'Van'],
  ['TRUCK', 'Truck'],
  ['MINI', 'Mini'],
];
const STATUS_OPTIONS = [
  ['', 'All Statuses'],
  ['AVAILABLE', 'Available'],
  ['ON_TRIP', 'On Trip'],
  ['IN_SHOP', 'In Shop'],
  ['RETIRED', 'Retired'],
];

const money = (n) => '₹' + Number(n).toLocaleString('en-IN');
const km = (n) => Number(n).toLocaleString('en-IN') + ' km';

export default function Vehicles() {
  const { user } = useAuth();
  const isManager = user?.role === 'FLEET_MANAGER';

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (type) params.type = type;
      if (status) params.status = status;
      if (search.trim()) params.search = search.trim();
      setVehicles(await listVehicles(params));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  }, [type, status, search]);

  // Debounce so typing in search doesn't hammer the API.
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(v) {
    setEditing(v);
    setModalOpen(true);
  }
  function onSaved() {
    setModalOpen(false);
    setEditing(null);
    load();
  }
  async function onDelete(v) {
    if (!window.confirm(`Delete ${v.name}? If it has trips it will be retired instead.`)) return;
    try {
      await deleteVehicle(v.slug);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed');
    }
  }

  const th = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500';
  const td = 'px-4 py-3 text-sm text-slate-700';
  const sel = 'rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none';

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Vehicle Registry</h1>
          <p className="text-sm text-slate-500">Fleet vehicles, status and capacity</p>
        </div>
        {isManager && (
          <button
            onClick={openAdd}
            className="btn btn-primary"
          >
            + Add Vehicle
          </button>
        )}
      </div>

      {/* Filter row */}
      <div className="mb-4 flex flex-wrap gap-3">
        <select value={type} onChange={(e) => setType(e.target.value)} className={sel}>
          {TYPE_OPTIONS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={sel}>
          {STATUS_OPTIONS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search reg no or name…"
          className={`${sel} min-w-[220px] flex-1`}
        />
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className={th}>Reg No</th>
              <th className={th}>Name / Model</th>
              <th className={th}>Type</th>
              <th className={th}>Capacity</th>
              <th className={th}>Odometer</th>
              <th className={th}>Acq. Cost</th>
              <th className={th}>Status</th>
              {isManager && <th className={`${th} text-right`}>Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <TableSkeleton cols={isManager ? 8 : 7} rows={5} />
            ) : vehicles.length === 0 ? (
              <tr>
                <td className={`${td} text-slate-400`} colSpan={isManager ? 8 : 7}>
                  No vehicles match these filters.
                </td>
              </tr>
            ) : (
              vehicles.map((v) => (
                <tr key={v.slug} className="hover:bg-slate-50">
                  <td className={`${td} font-medium`}>{v.regNo}</td>
                  <td className={td}>{v.name}</td>
                  <td className={td}>{v.type}</td>
                  <td className={td}>{Number(v.capacityKg).toLocaleString('en-IN')} kg</td>
                  <td className={td}>{km(v.odometer)}</td>
                  <td className={td}>{money(v.acquisitionCost)}</td>
                  <td className={td}>
                    <StatusBadge status={v.status} />
                  </td>
                  {isManager && (
                    <td className={`${td} text-right whitespace-nowrap`}>
                      <button
                        onClick={() => openEdit(v)}
                        className="btn btn-link-blue btn-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(v)}
                        className="btn btn-link-danger btn-sm ml-3"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        Registration No. must be unique · Retired/In Shop vehicles are hidden from Trip Dispatcher
      </p>

      {isManager && (
        <VehicleFormModal
          open={modalOpen}
          vehicle={editing}
          onClose={() => setModalOpen(false)}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}
