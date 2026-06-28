import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../../services/order.service.js';
import toast from 'react-hot-toast';
import { CheckCircle, Clock, ChefHat, Flame } from 'lucide-react';

const STATUS_CONFIG = {
  received: { label: 'New Orders',        icon: Clock,        color: '#3b82f6', next: 'preparing', nextLabel: 'Start Preparing' },
  preparing:{ label: 'Preparing',          icon: Flame,        color: '#f59e0b', next: 'ready',     nextLabel: 'Mark Ready'      },
  ready:    { label: 'Ready for Pickup',   icon: CheckCircle,  color: '#10b981', next: 'delivered', nextLabel: 'Delivered'       },
};

function OrderCard({ order, onStatusChange, isPending }) {
  const cfg = STATUS_CONFIG[order.status];
  return (
    <div className="card border-l-4" style={{ borderLeftColor: cfg?.color }}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-bold text-gray-900">#{order.orderNumber}</p>
          <p className="text-sm text-gray-500">
            {order.type.replace('_', ' ')}
            {order.tableNumber && ` · Table ${order.tableNumber}`}
          </p>
        </div>
        <span className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleTimeString()}</span>
      </div>

      <div className="space-y-1 mb-4">
        {order.items?.map((item) => (
          <div key={item.id} className="flex items-center gap-2 text-sm">
            <span className="font-medium text-gray-900">{item.quantity}×</span>
            <span className="text-gray-700">{item.menuItemName}</span>
            {item.notes && <span className="text-xs text-gray-400 italic">({item.notes})</span>}
          </div>
        ))}
      </div>

      {cfg?.next && (
        <button
          onClick={() => onStatusChange(order.id, cfg.next)}
          disabled={isPending}
          className="btn-primary w-full text-sm py-1.5 disabled:opacity-50"
        >
          {cfg.nextLabel}
        </button>
      )}
    </div>
  );
}

function KitchenColumn({ status, onStatusChange, isPending }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;

  const { data } = useQuery({
    queryKey: ['orders', status],
    queryFn: () => orderService.list({ status }),
    refetchInterval: 10_000,
    select: (res) => res.data?.data ?? [],
  });

  const orders = data ?? [];

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4" style={{ color: cfg.color }} />
        <h2 className="font-bold text-gray-800">{cfg.label}</h2>
        <span
          className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
          style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}
        >
          {orders.length}
        </span>
      </div>

      <div className="space-y-3">
        {orders.length === 0 ? (
          <div className="text-center py-10 text-gray-300">
            <p className="text-sm">No orders</p>
          </div>
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={onStatusChange}
              isPending={isPending}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default function KitchenPage() {
  const qc = useQueryClient();

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => orderService.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  });

  const handleStatusChange = (id, status) => updateStatus.mutate({ id, status });

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-5">
        <ChefHat className="w-6 h-6 sm:w-7 sm:h-7 text-brand-500" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kitchen Display</h1>
          <p className="text-xs text-gray-400">Auto-refreshes every 10 seconds</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {Object.keys(STATUS_CONFIG).map((status) => (
          <KitchenColumn
            key={status}
            status={status}
            onStatusChange={handleStatusChange}
            isPending={updateStatus.isPending}
          />
        ))}
      </div>
    </div>
  );
}
