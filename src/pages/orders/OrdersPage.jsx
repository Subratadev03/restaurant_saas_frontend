import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../../services/order.service.js';
import toast from 'react-hot-toast';
import {
  ClipboardList, Filter, ChevronRight, ChevronDown, ChevronUp,
  User, MapPin, Phone, FileText, Package, CreditCard, Utensils, X,
} from 'lucide-react';

const STATUS_OPTIONS = ['all', 'received', 'preparing', 'ready', 'delivered', 'cancelled'];
const STATUS_BADGE   = {
  received:  'badge-blue',
  preparing: 'badge-yellow',
  ready:     'badge-green',
  delivered: 'badge-gray',
  cancelled: 'badge-red',
};
const NEXT_STATUS = {
  received: 'preparing', preparing: 'ready', ready: 'delivered',
};
const TYPE_ICON = {
  dine_in:  '🍽️',
  takeaway: '🥡',
  delivery: '🛵',
  online:   '📱',
};

// ─── Expandable order detail panel ───────────────────────────────────────────
function OrderDetailPanel({ order, onClose }) {
  return (
    <div className="bg-gray-50 border-b border-gray-100 animate-in slide-in-from-top-1 duration-150">
      <div className="px-4 py-4 grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* ── Col 1: Meta ──────────────────────────────── */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Order Info</p>
          <div className="space-y-1 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-gray-400" />
              <span className="font-medium">#{order.orderNumber}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs w-3.5 text-center">{TYPE_ICON[order.type] || '•'}</span>
              <span className="capitalize">{order.type.replace('_', ' ')}</span>
            </div>
            {(order.tableNumber || order.table) && (
              <div className="flex items-center gap-2">
                <Utensils className="w-3.5 h-3.5 text-brand-500" />
                <span className="font-medium text-brand-700">
                  Table {order.tableNumber || order.table?.tableNumber}
                  {order.table?.tableName && ` — ${order.table.tableName}`}
                  {order.table?.tableType && (
                    <span className="ml-1 text-xs bg-brand-100 text-brand-600 px-1.5 py-0.5 rounded-full capitalize">
                      {order.table.tableType.replace('_', ' ')}
                    </span>
                  )}
                </span>
              </div>
            )}
            {order.customer && (
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-gray-400" />
                <span>
                  {order.customer.firstName}{order.customer.lastName ? ' ' + order.customer.lastName : ''}
                  {order.customer.phone && <span className="text-gray-400 ml-1 text-xs">· {order.customer.phone}</span>}
                </span>
              </div>
            )}
            {order.deliveryAddress && (
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
                <span className="text-xs">{JSON.stringify(order.deliveryAddress)}</span>
              </div>
            )}
            {order.notes && (
              <div className="flex items-start gap-2">
                <Phone className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
                <span className="text-xs italic text-gray-500">"{order.notes}"</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Col 2: Items ─────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            <Package className="w-3.5 h-3.5 inline mr-1" />Items
          </p>
          {order.items?.length > 0 ? (
            <div className="space-y-1.5">
              {order.items.map((item, idx) => (
                <div key={item.id ?? idx} className="flex items-center justify-between text-sm bg-white rounded-lg px-3 py-2 border border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-brand-100 text-brand-700 rounded-full text-xs flex items-center justify-center font-semibold">
                      {item.quantity}
                    </span>
                    <span className="text-gray-800">{item.name || item.itemName || `Item #${idx + 1}`}</span>
                    {item.notes && <span className="text-xs text-gray-400 italic">({item.notes})</span>}
                  </div>
                  <span className="text-gray-700 font-medium">₹{Number(item.unitPrice || item.price || 0) * item.quantity}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">No item details available</p>
          )}
        </div>

        {/* ── Col 3: Payment ───────────────────────────── */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            <CreditCard className="w-3.5 h-3.5 inline mr-1" />Payment
          </p>
          <div className="bg-white rounded-xl border border-gray-100 p-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>₹{Number(order.subtotal || 0).toFixed(2)}</span>
            </div>
            {Number(order.taxAmount) > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>₹{Number(order.taxAmount).toFixed(2)}</span>
              </div>
            )}
            {Number(order.discountAmount) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>−₹{Number(order.discountAmount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 border-t border-gray-100 pt-1.5 mt-1">
              <span>Total</span>
              <span>₹{Number(order.totalAmount || 0).toFixed(2)}</span>
            </div>
          </div>

          {order.payment && (
            <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
              <CreditCard className="w-3 h-3" />
              Paid via {order.payment.method} · {order.payment.status}
            </div>
          )}

          <p className="text-xs text-gray-400 mt-1">
            Placed: {new Date(order.createdAt).toLocaleString()}
            {order.completedAt && ` · Done: ${new Date(order.completedAt).toLocaleString()}`}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const [status, setStatus]       = useState('all');
  const [page, setPage]           = useState(1);
  const [expanded, setExpanded]   = useState(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['orders', 'list', status, page],
    queryFn:  () => orderService.list({ status: status === 'all' ? undefined : status, page, limit: 20 }),
  });

  const { data: detailData } = useQuery({
    queryKey: ['order', expanded],
    queryFn:  () => orderService.getById(expanded),
    enabled:  !!expanded,
    select:   (r) => r.data?.data,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, next }) => orderService.updateStatus(id, next),
    onSuccess:  () => { toast.success('Order updated'); qc.invalidateQueries({ queryKey: ['orders'] }); },
    onError:    (err) => toast.error(err.response?.data?.message || 'Update failed'),
  });

  const orders     = data?.data?.data     ?? [];
  const pagination = data?.data?.pagination;
  const toggleExpand = (id) => setExpanded((prev) => (prev === id ? null : id));

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6 text-brand-500" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Orders</h1>
          {pagination && <span className="text-sm text-gray-400 hidden sm:inline">{pagination.total} total</span>}
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select className="input text-sm w-36 sm:w-44" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Mobile: card list ──────────────────────────────────────────── */}
      <div className="sm:hidden space-y-3">
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Loading…</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No orders found</div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="card p-0 overflow-hidden">
              <button
                className={`w-full text-left p-4 ${expanded === order.id ? 'bg-brand-50' : ''}`}
                onClick={() => toggleExpand(order.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900">#{order.orderNumber}</span>
                      <span className={STATUS_BADGE[order.status] || 'badge-gray'}>{order.status}</span>
                      {order.tableNumber && <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">T-{order.tableNumber}</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {TYPE_ICON[order.type]} {order.type.replace('_', ' ')}
                      {order.customer && ` · ${order.customer.firstName}${order.customer.lastName ? ' ' + order.customer.lastName : ''}`}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-gray-900">₹{Number(order.totalAmount || 0).toFixed(2)}</p>
                    <p className="text-xs text-gray-400">{order.items?.length ?? 0} items</p>
                    {NEXT_STATUS[order.status] && (
                      <button
                        onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ id: order.id, next: NEXT_STATUS[order.status] }); }}
                        className="mt-1 text-xs text-brand-600 font-semibold"
                      >
                        → {NEXT_STATUS[order.status]}
                      </button>
                    )}
                  </div>
                </div>
              </button>
              {expanded === order.id && (
                <div className="border-t border-gray-100">
                  <OrderDetailPanel order={detailData ?? order} onClose={() => setExpanded(null)} />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* ── Desktop: table ─────────────────────────────────────────────── */}
      <div className="hidden sm:block card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-semibold text-gray-600 w-6" />
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Order</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Type</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Table</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Items</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Total</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Time</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={9} className="text-center py-12 text-gray-400">Loading orders...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-12 text-gray-400">No orders found</td></tr>
            ) : (
              orders.map((order) => (
                <>
                  <tr
                    key={order.id}
                    className={`border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${expanded === order.id ? 'bg-brand-50' : ''}`}
                    onClick={() => toggleExpand(order.id)}
                  >
                    <td className="px-4 py-3 text-gray-400">
                      {expanded === order.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">#{order.orderNumber}</p>
                      {order.customer && (
                        <p className="text-xs text-gray-400">
                          {order.customer.firstName}{order.customer.lastName ? ' ' + order.customer.lastName : ''}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="capitalize">{TYPE_ICON[order.type]} {order.type.replace('_', ' ')}</span>
                    </td>
                    <td className="px-4 py-3">
                      {order.tableNumber ? (
                        <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full font-medium">T-{order.tableNumber}</span>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{order.items?.length ?? 0} item(s)</td>
                    <td className="px-4 py-3">
                      <span className={STATUS_BADGE[order.status] || 'badge-gray'}>{order.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">₹{Number(order.totalAmount || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{new Date(order.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {NEXT_STATUS[order.status] && (
                        <button
                          onClick={() => updateStatus.mutate({ id: order.id, next: NEXT_STATUS[order.status] })}
                          disabled={updateStatus.isPending}
                          className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-800 font-medium disabled:opacity-50 whitespace-nowrap"
                        >
                          → {NEXT_STATUS[order.status]} <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                  {expanded === order.id && (
                    <tr key={`${order.id}-detail`}>
                      <td colSpan={9} className="p-0">
                        <OrderDetailPanel order={detailData ?? order} onClose={() => setExpanded(null)} />
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>

        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">Page {pagination.page} of {pagination.pages} · {pagination.total} orders</p>
            <div className="flex gap-2">
              <button className="btn-secondary text-xs py-1" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
              <button className="btn-secondary text-xs py-1" disabled={page >= pagination.pages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
