import { useQuery } from '@tanstack/react-query';
import { customerService } from '../../services/index.js';
import { Users, Star } from 'lucide-react';

export default function CustomersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.list({ limit: 50 }),
  });

  const customers = data?.data?.data || [];

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-5">
        <Users className="w-5 h-5 sm:w-6 sm:h-6 text-brand-500" />
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Customers</h1>
      </div>

      {/* Mobile: card list */}
      <div className="sm:hidden space-y-3">
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Loading…</div>
        ) : customers.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No customers yet</div>
        ) : (
          customers.map((customer) => (
            <div key={customer.id} className="card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold flex-shrink-0">
                  {customer.firstName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{customer.firstName} {customer.lastName}</p>
                    {customer.tags?.includes('vip') && (
                      <span className="badge-yellow inline-flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5" /> VIP
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{customer.phone || customer.email || '—'}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-gray-900">₹{customer.totalSpent || 0}</p>
                  <p className="text-xs text-gray-400">{customer.totalOrders || 0} orders</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden sm:block card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Customer</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Contact</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Orders</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Total Spent</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Last Order</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400">Loading...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400">No customers yet</td></tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-semibold text-sm">
                        {customer.firstName[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{customer.firstName} {customer.lastName}</p>
                        {customer.tags?.includes('vip') && (
                          <span className="badge-yellow inline-flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5" /> VIP
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    <p>{customer.phone || '—'}</p>
                    <p className="text-xs text-gray-400">{customer.email || ''}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{customer.totalOrders}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">₹{customer.totalSpent}</td>
                  <td className="px-4 py-3 text-gray-400">
                    {customer.lastOrderAt ? new Date(customer.lastOrderAt).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
