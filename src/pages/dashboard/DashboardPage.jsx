import { useQuery } from '@tanstack/react-query';
import { orderService } from '../../services/order.service.js';
import { inventoryService, customerService } from '../../services/index.js';
import { useAuthStore } from '../../store/auth.store.js';
import { ShoppingCart, Package, Users, TrendingUp, AlertTriangle, Clock } from 'lucide-react';

const STATUS_BADGE = {
  received:  'badge-blue',
  preparing: 'badge-yellow',
  ready:     'badge-green',
  delivered: 'badge-gray',
  cancelled: 'badge-red',
};

function StatCard({ icon: Icon, label, value, sub, color = 'brand', loading = false }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {loading ? <span className="animate-pulse text-gray-300">—</span> : value}
          </p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl bg-${color}-100 flex items-center justify-center`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { restaurant } = useAuthStore();

  const { data: activeOrdersData, isLoading: loadingActive } = useQuery({
    queryKey: ['orders', 'received'],
    queryFn: () => orderService.list({ status: 'received', limit: 100 }),
    refetchInterval: 15_000,
    select: (r) => r.data?.data ?? [],
  });

  const { data: todayRevenueData, isLoading: loadingRevenue } = useQuery({
    queryKey: ['orders', 'delivered', 'today'],
    queryFn: () => orderService.list({ status: 'delivered', limit: 100 }),
    refetchInterval: 30_000,
    select: (r) => {
      const today = new Date().toDateString();
      const orders = r.data?.data ?? [];
      const todayOrders = orders.filter((o) => new Date(o.completedAt || o.updatedAt).toDateString() === today);
      const revenue = todayOrders.reduce((s, o) => s + parseFloat(o.totalAmount || 0), 0);
      return { revenue, count: todayOrders.length };
    },
  });

  const { data: lowStockData, isLoading: loadingStock } = useQuery({
    queryKey: ['stock-alerts'],
    queryFn: () => inventoryService.getLowStockAlerts(),
    refetchInterval: 60_000,
    select: (r) => r.data?.data ?? [],
  });

  const { data: customersData, isLoading: loadingCustomers } = useQuery({
    queryKey: ['customers', 'count'],
    queryFn: () => customerService.list({ limit: 1 }),
    select: (r) => r.data?.pagination?.total ?? 0,
  });

  const activeOrders = activeOrdersData ?? [];
  const lowStockItems = lowStockData ?? [];

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          {restaurant?.name || 'Your Restaurant'} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard
          icon={ShoppingCart}
          label="Active Orders"
          value={activeOrders.length}
          sub="Waiting to be processed"
          color="brand"
          loading={loadingActive}
        />
        <StatCard
          icon={TrendingUp}
          label="Today's Revenue"
          value={`₹${(todayRevenueData?.revenue ?? 0).toFixed(0)}`}
          sub={`${todayRevenueData?.count ?? 0} orders completed today`}
          color="green"
          loading={loadingRevenue}
        />
        <StatCard
          icon={Users}
          label="Total Customers"
          value={customersData ?? 0}
          sub="Registered customer profiles"
          color="blue"
          loading={loadingCustomers}
        />
        <StatCard
          icon={Package}
          label="Low Stock Items"
          value={lowStockItems.length}
          sub={lowStockItems.length > 0 ? 'Needs restocking' : 'All stock levels OK'}
          color="red"
          loading={loadingStock}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Orders */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Active Orders</h2>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              Auto-refreshes every 15s
            </div>
          </div>

          {activeOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No active orders right now</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeOrders.slice(0, 8).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">#{order.orderNumber}</p>
                    <p className="text-xs text-gray-500">
                      {order.type.replace('_', ' ')}
                      {order.tableNumber ? ` · Table ${order.tableNumber}` : ''}
                      {' · '}{order.items?.length ?? 0} item(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={STATUS_BADGE[order.status] || 'badge-gray'}>{order.status}</span>
                    <p className="text-sm font-semibold text-gray-900 mt-1">₹{order.totalAmount}</p>
                  </div>
                </div>
              ))}
              {activeOrders.length > 8 && (
                <p className="text-xs text-center text-gray-400">+{activeOrders.length - 8} more</p>
              )}
            </div>
          )}
        </div>

        {/* Low stock alerts */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h2 className="font-semibold text-gray-900">Low Stock Alerts</h2>
          </div>

          {lowStockItems.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">All stock levels are OK</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lowStockItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-red-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">Threshold: {item.low_stock_threshold} {item.unit}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-600">{parseFloat(item.quantity).toFixed(1)}</p>
                    <p className="text-xs text-gray-500">{item.unit}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
