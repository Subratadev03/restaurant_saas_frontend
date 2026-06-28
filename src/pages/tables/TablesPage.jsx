import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tableService } from '../../services/index.js';
import toast from 'react-hot-toast';
import {
  LayoutGrid, Plus, Pencil, Trash2, X, Users, Star, Eye,
  TreePine, Wine, Crown, Home, Calendar, Clock, Phone,
  CheckCircle, XCircle, ChevronDown, ChevronUp, AlertCircle,
} from 'lucide-react';

// ─── Constants ───────────────────────────────────────────────────────────────
const TABLE_TYPES = [
  { value: 'standard',   label: 'Standard',   icon: Home,     color: 'gray' },
  { value: 'sweet_spot', label: 'Sweet Spot',  icon: Star,     color: 'yellow' },
  { value: 'best_view',  label: 'Best View',   icon: Eye,      color: 'blue' },
  { value: 'private',    label: 'Private',     icon: Crown,    color: 'purple' },
  { value: 'outdoor',    label: 'Outdoor',     icon: TreePine, color: 'green' },
  { value: 'bar',        label: 'Bar',         icon: Wine,     color: 'red' },
  { value: 'vip',        label: 'VIP',         icon: Crown,    color: 'amber' },
  { value: 'family',     label: 'Family',      icon: Users,    color: 'teal' },
];

const TABLE_STATUSES = ['available', 'occupied', 'reserved', 'inactive'];

const STATUS_CONFIG = {
  available: { color: 'bg-green-100 border-green-300 text-green-800',  dot: 'bg-green-500',  badge: 'badge-green'  },
  occupied:  { color: 'bg-red-100 border-red-300 text-red-800',        dot: 'bg-red-500',    badge: 'badge-red'    },
  reserved:  { color: 'bg-yellow-100 border-yellow-300 text-yellow-800', dot: 'bg-yellow-500', badge: 'badge-yellow' },
  inactive:  { color: 'bg-gray-100 border-gray-300 text-gray-400',     dot: 'bg-gray-400',   badge: 'badge-gray'   },
};

const TYPE_CONFIG = {
  standard:   { bg: 'bg-gray-50',   border: 'border-gray-200',   text: 'text-gray-600'   },
  sweet_spot: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' },
  best_view:  { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700'   },
  private:    { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
  outdoor:    { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700'  },
  bar:        { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700'    },
  vip:        { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700'  },
  family:     { bg: 'bg-teal-50',   border: 'border-teal-200',   text: 'text-teal-700'   },
};

const RESERVATION_STATUSES = ['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show'];

// ─── Table Form Modal ─────────────────────────────────────────────────────────
function TableModal({ table, onClose }) {
  const qc = useQueryClient();
  const isEdit = !!table;
  const [form, setForm] = useState(
    isEdit
      ? { ...table, features: (table.features || []).join(', ') }
      : { tableNumber: '', tableName: '', tableType: 'standard', capacity: 4, floor: '', description: '', features: '' }
  );

  const save = useMutation({
    mutationFn: (data) => isEdit ? tableService.updateTable(table.id, data) : tableService.createTable(data),
    onSuccess: () => {
      toast.success(isEdit ? 'Table updated' : 'Table created');
      qc.invalidateQueries({ queryKey: ['tables'] });
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Save failed'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    save.mutate({
      tableNumber: form.tableNumber,
      tableName:   form.tableName || undefined,
      tableType:   form.tableType,
      capacity:    parseInt(form.capacity) || 4,
      floor:       form.floor || undefined,
      description: form.description || undefined,
      features:    form.features ? form.features.split(',').map((f) => f.trim()).filter(Boolean) : [],
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Table' : 'Add Table'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Table Number *</label>
              <input required className="input" placeholder="e.g. T1, A5" value={form.tableNumber}
                onChange={(e) => setForm({ ...form, tableNumber: e.target.value })} />
            </div>
            <div>
              <label className="label">Friendly Name</label>
              <input className="input" placeholder="e.g. Window Booth" value={form.tableName}
                onChange={(e) => setForm({ ...form, tableName: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="label">Table Type</label>
            <div className="grid grid-cols-4 gap-2">
              {TABLE_TYPES.map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm({ ...form, tableType: value })}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 text-xs font-medium transition-all ${
                    form.tableType === value
                      ? `border-brand-500 bg-brand-50 text-brand-700`
                      : 'border-gray-200 hover:border-gray-300 text-gray-500'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Capacity (seats)</label>
              <input type="number" min="1" max="50" className="input" value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
            </div>
            <div>
              <label className="label">Floor / Section</label>
              <input className="input" placeholder="Ground, 1st Floor…" value={form.floor}
                onChange={(e) => setForm({ ...form, floor: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="label">Description</label>
            <textarea className="input h-16 resize-none" placeholder="Any special notes about this table"
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          <div>
            <label className="label">Features (comma separated)</label>
            <input className="input" placeholder="window view, AC, outdoor, wheelchair accessible"
              value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={save.isPending} className="btn-primary flex-1">
              {save.isPending ? 'Saving…' : isEdit ? 'Update Table' : 'Add Table'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Reservation Form Modal ───────────────────────────────────────────────────
function ReservationModal({ table, reservation, onClose }) {
  const qc = useQueryClient();
  const isEdit = !!reservation;
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState(
    isEdit ? { ...reservation } : {
      guestName: '', guestPhone: '', guestEmail: '', partySize: 2,
      reservationDate: today, startTime: '19:00', endTime: '21:00',
      notes: '', specialRequests: '',
    }
  );

  const save = useMutation({
    mutationFn: (data) => isEdit
      ? tableService.updateReservation(reservation.id, data)
      : tableService.createReservation({ ...data, tableId: table.id }),
    onSuccess: () => {
      toast.success(isEdit ? 'Reservation updated' : 'Reservation created');
      qc.invalidateQueries({ queryKey: ['tables'] });
      qc.invalidateQueries({ queryKey: ['reservations'] });
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Reservation' : 'New Reservation'}</h2>
            {table && <p className="text-sm text-gray-500">Table {table.tableNumber}{table.tableName ? ` — ${table.tableName}` : ''}</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); save.mutate(form); }} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Guest Name *</label>
              <input required className="input" placeholder="John Doe" value={form.guestName}
                onChange={(e) => setForm({ ...form, guestName: e.target.value })} />
            </div>
            <div>
              <label className="label">Party Size</label>
              <input type="number" min="1" max="50" className="input" value={form.partySize}
                onChange={(e) => setForm({ ...form, partySize: parseInt(e.target.value) || 1 })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Phone</label>
              <input className="input" placeholder="+91 9876543210" value={form.guestPhone}
                onChange={(e) => setForm({ ...form, guestPhone: e.target.value })} />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" placeholder="guest@email.com" value={form.guestEmail}
                onChange={(e) => setForm({ ...form, guestEmail: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="label">Date *</label>
            <input required type="date" className="input" min={today} value={form.reservationDate}
              onChange={(e) => setForm({ ...form, reservationDate: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Time *</label>
              <input required type="time" className="input" value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            </div>
            <div>
              <label className="label">End Time</label>
              <input type="time" className="input" value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
            </div>
          </div>

          {isEdit && (
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {RESERVATION_STATUSES.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="label">Special Requests</label>
            <textarea className="input h-16 resize-none" placeholder="Birthday cake, wheelchair access…"
              value={form.specialRequests} onChange={(e) => setForm({ ...form, specialRequests: e.target.value })} />
          </div>

          <div>
            <label className="label">Internal Notes</label>
            <textarea className="input h-16 resize-none" placeholder="Staff notes…"
              value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={save.isPending} className="btn-primary flex-1">
              {save.isPending ? 'Saving…' : isEdit ? 'Update' : 'Reserve Table'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Single Table Card ────────────────────────────────────────────────────────
function TableCard({ table, onEdit, onReserve, onStatusChange, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const typeConf   = TYPE_CONFIG[table.tableType]   || TYPE_CONFIG.standard;
  const statusConf = STATUS_CONFIG[table.status]    || STATUS_CONFIG.available;
  const typeInfo   = TABLE_TYPES.find((t) => t.value === table.tableType);
  const Icon       = typeInfo?.icon || Home;

  const todayReservations = table.reservations ?? [];

  return (
    <div className={`rounded-2xl border-2 p-4 transition-all ${typeConf.bg} ${typeConf.border}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${typeConf.bg} border ${typeConf.border}`}>
            <Icon className={`w-4 h-4 ${typeConf.text}`} />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">Table {table.tableNumber}</p>
            {table.tableName && <p className={`text-xs ${typeConf.text} font-medium`}>{table.tableName}</p>}
          </div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize border ${statusConf.color}`}>
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${statusConf.dot} mr-1`} />
          {table.status}
        </span>
      </div>

      {/* Info */}
      <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{table.capacity} seats</span>
        <span className={`capitalize font-medium ${typeConf.text}`}>{typeInfo?.label}</span>
        {table.floor && <span>· {table.floor}</span>}
      </div>

      {/* Features */}
      {table.features?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {table.features.map((f) => (
            <span key={f} className="text-xs bg-white/60 border border-white/80 px-2 py-0.5 rounded-full text-gray-600">{f}</span>
          ))}
        </div>
      )}

      {/* Today's reservation preview */}
      {todayReservations.length > 0 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-xs bg-white/70 rounded-lg px-3 py-2 mb-3 hover:bg-white/90 transition-colors"
        >
          <span className="flex items-center gap-1 font-medium text-gray-700">
            <Calendar className="w-3 h-3 text-brand-500" />
            {todayReservations.length} reservation{todayReservations.length > 1 ? 's' : ''} today
          </span>
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      )}

      {expanded && todayReservations.map((r) => (
        <div key={r.id} className="bg-white/80 rounded-lg px-3 py-2 mb-1.5 text-xs space-y-0.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-800">{r.guestName}</span>
            <span className="text-gray-500">{r.startTime} – {r.endTime || '?'}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-500">
            <span><Users className="w-3 h-3 inline mr-0.5" />{r.partySize}</span>
            {r.guestPhone && <span><Phone className="w-3 h-3 inline mr-0.5" />{r.guestPhone}</span>}
            <span className={`capitalize font-medium ${r.status === 'confirmed' ? 'text-green-600' : r.status === 'cancelled' ? 'text-red-500' : 'text-yellow-600'}`}>{r.status}</span>
          </div>
        </div>
      ))}

      {/* Actions */}
      <div className="flex gap-1.5 mt-3 pt-3 border-t border-white/50">
        <button onClick={() => onEdit(table)} className="btn-secondary flex-1 text-xs py-1.5 flex items-center justify-center gap-1">
          <Pencil className="w-3 h-3" /> Edit
        </button>
        <button onClick={() => onReserve(table)} className="btn-secondary flex-1 text-xs py-1.5 flex items-center justify-center gap-1 text-brand-600">
          <Calendar className="w-3 h-3" /> Reserve
        </button>
        <select
          value={table.status}
          onChange={(e) => onStatusChange(table.id, e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-1 py-1 bg-white text-gray-600"
          onClick={(e) => e.stopPropagation()}
        >
          {TABLE_STATUSES.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <button onClick={() => onDelete(table.id)} className="text-red-400 hover:text-red-600 px-2 hover:bg-red-50 rounded-lg">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Reservations List Panel ──────────────────────────────────────────────────
function ReservationsPanel({ onNewReservation }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate]     = useState(today);
  const [filterStatus, setFilterStatus] = useState('');
  const [editReservation, setEditReservation] = useState(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['reservations', date, filterStatus],
    queryFn: () => tableService.getReservations({ date, status: filterStatus || undefined }),
    select: (r) => r.data?.data ?? [],
  });

  const cancel = useMutation({
    mutationFn: (id) => tableService.cancelReservation(id),
    onSuccess: () => { toast.success('Reservation cancelled'); qc.invalidateQueries({ queryKey: ['reservations'] }); qc.invalidateQueries({ queryKey: ['tables'] }); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const reservations = data ?? [];

  return (
    <div className="card p-0 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h3 className="font-bold text-gray-900">Reservations</h3>
        <div className="flex items-center gap-2">
          <input type="date" className="input text-sm py-1.5 w-36" value={date} onChange={(e) => setDate(e.target.value)} />
          <select className="input text-sm py-1.5 w-32" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All</option>
            {RESERVATION_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-400 text-sm">Loading reservations…</div>
      ) : reservations.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">
          <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No reservations for this date
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {reservations.map((r) => (
            <div key={r.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 text-sm">{r.guestName}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                      r.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      r.status === 'pending'   ? 'bg-yellow-100 text-yellow-700' :
                      r.status === 'seated'    ? 'bg-blue-100 text-blue-700' :
                      r.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                      'bg-gray-100 text-gray-500'
                    }`}>{r.status}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.startTime} – {r.endTime || '?'}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{r.partySize} pax</span>
                    {r.table && <span className="font-medium text-brand-600">T-{r.table.tableNumber}</span>}
                    {r.guestPhone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{r.guestPhone}</span>}
                  </div>
                  {r.specialRequests && (
                    <p className="text-xs text-gray-400 mt-1 italic">"{r.specialRequests}"</p>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => setEditReservation(r)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  {!['cancelled', 'completed', 'no_show'].includes(r.status) && (
                    <button onClick={() => { if (window.confirm('Cancel this reservation?')) cancel.mutate(r.id); }} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editReservation && (
        <ReservationModal reservation={editReservation} onClose={() => setEditReservation(null)} />
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TablesPage() {
  const qc = useQueryClient();
  const [editTable, setEditTable]           = useState(null);
  const [reserveTable, setReserveTable]     = useState(null);
  const [showAddTable, setShowAddTable]     = useState(false);
  const [filterType, setFilterType]         = useState('');
  const [filterStatus, setFilterStatus]     = useState('');
  const [view, setView]                     = useState('grid'); // 'grid' | 'reservations'

  const { data, isLoading } = useQuery({
    queryKey: ['tables', filterType, filterStatus],
    queryFn: () => tableService.getTables({ tableType: filterType || undefined, status: filterStatus || undefined }),
    select: (r) => r.data?.data ?? [],
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => tableService.updateTableStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tables'] }),
    onError: (err) => toast.error(err.response?.data?.message || 'Status update failed'),
  });

  const deleteTable = useMutation({
    mutationFn: (id) => tableService.deleteTable(id),
    onSuccess: () => { toast.success('Table deleted'); qc.invalidateQueries({ queryKey: ['tables'] }); },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed'),
  });

  const tables     = data ?? [];
  const available  = tables.filter((t) => t.status === 'available').length;
  const occupied   = tables.filter((t) => t.status === 'occupied').length;
  const reserved   = tables.filter((t) => t.status === 'reserved').length;

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <LayoutGrid className="w-5 h-5 sm:w-6 sm:h-6 text-brand-500" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Table Management</h1>
            <p className="text-sm text-gray-500">{tables.length} tables · {available} free · {occupied} occupied · {reserved} reserved</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView(view === 'grid' ? 'reservations' : 'grid')}
            className={`btn-secondary flex items-center gap-2 ${view === 'reservations' ? 'bg-brand-50 border-brand-200 text-brand-700' : ''}`}
          >
            <Calendar className="w-4 h-4" />
            {view === 'grid' ? 'View Reservations' : 'View Tables'}
          </button>
          <button onClick={() => setShowAddTable(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Table
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-5">
        {[
          { label: 'Total Tables', value: tables.length, bg: 'bg-gray-50', text: 'text-gray-700' },
          { label: 'Available',    value: available,     bg: 'bg-green-50', text: 'text-green-700' },
          { label: 'Occupied',     value: occupied,      bg: 'bg-red-50',   text: 'text-red-700'   },
          { label: 'Reserved',     value: reserved,      bg: 'bg-yellow-50', text: 'text-yellow-700' },
        ].map(({ label, value, bg, text }) => (
          <div key={label} className={`${bg} rounded-xl p-4 text-center border border-white`}>
            <p className={`text-2xl font-bold ${text}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {view === 'grid' ? (
        <>
          {/* Filters */}
          <div className="flex gap-3 mb-5 flex-wrap">
            <select className="input text-sm w-44" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">All Types</option>
              {TABLE_TYPES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </select>
            <select className="input text-sm w-44" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              {TABLE_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>

          {isLoading ? (
            <div className="text-center py-16 text-gray-400">Loading tables…</div>
          ) : tables.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <LayoutGrid className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No tables yet</p>
              <p className="text-sm mt-1">Add your first table to start managing seating</p>
              <button onClick={() => setShowAddTable(true)} className="btn-primary mt-4">
                <Plus className="w-4 h-4 inline mr-1" /> Add Table
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {tables.map((table) => (
                <TableCard
                  key={table.id}
                  table={table}
                  onEdit={setEditTable}
                  onReserve={setReserveTable}
                  onStatusChange={(id, status) => updateStatus.mutate({ id, status })}
                  onDelete={(id) => { if (window.confirm('Delete this table?')) deleteTable.mutate(id); }}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <ReservationsPanel onNewReservation={() => {}} />
      )}

      {/* Modals */}
      {showAddTable && <TableModal onClose={() => setShowAddTable(false)} />}
      {editTable    && <TableModal table={editTable} onClose={() => setEditTable(null)} />}
      {reserveTable && <ReservationModal table={reserveTable} onClose={() => setReserveTable(null)} />}
    </div>
  );
}
