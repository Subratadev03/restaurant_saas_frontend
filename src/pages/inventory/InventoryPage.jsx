import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '../../services/index.js';
import toast from 'react-hot-toast';
import { Package, AlertTriangle, Plus, RefreshCw } from 'lucide-react';

function RestockModal({ onClose }) {
  const qc = useQueryClient();
  const { data: ingredients = [] } = useQuery({
    queryKey: ['ingredients'],
    queryFn: () => inventoryService.listIngredients().then((r) => r.data.data),
  });
  const [form, setForm] = useState({ ingredientId: '', quantity: '' });

  const restock = useMutation({
    mutationFn: (data) => inventoryService.restock(data),
    onSuccess: () => { toast.success('Stock updated'); qc.invalidateQueries(['ingredients']); onClose(); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-sm p-6">
        <h3 className="font-bold text-gray-900 mb-4">Restock Ingredient</h3>
        <div className="space-y-3 mb-4">
          <div>
            <label className="label">Ingredient</label>
            <select className="input" value={form.ingredientId} onChange={(e) => setForm({ ...form, ingredientId: e.target.value })}>
              <option value="">Select ingredient</option>
              {ingredients.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Quantity to add</label>
            <input className="input" type="number" min="0.001" step="0.001" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary flex-1"
            disabled={!form.ingredientId || !form.quantity || restock.isPending}
            onClick={() => restock.mutate({ ingredientId: form.ingredientId, quantity: parseFloat(form.quantity) })}
          >
            {restock.isPending ? 'Updating...' : 'Update Stock'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const [showRestock, setShowRestock] = useState(false);

  const { data: ingredientsRes, isLoading } = useQuery({
    queryKey: ['ingredients'],
    queryFn: () => inventoryService.listIngredients(),
  });

  const { data: alertsRes } = useQuery({
    queryKey: ['stock-alerts'],
    queryFn: () => inventoryService.getLowStockAlerts(),
  });

  const ingredients = ingredientsRes?.data?.data || [];
  const alerts = alertsRes?.data?.data || [];

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Package className="w-6 h-6 text-brand-500" />
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        </div>
        <button onClick={() => setShowRestock(true)} className="btn-primary flex items-center gap-2 text-sm">
          <RefreshCw className="w-4 h-4" /> Restock
        </button>
      </div>

      {alerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="font-semibold text-red-800 text-sm">{alerts.length} item(s) running low</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {alerts.map((a) => (
              <span key={a.id} className="badge-red">{a.name}: {a.quantity} {a.unit}</span>
            ))}
          </div>
        </div>
      )}

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Ingredient</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Category</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Unit</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Stock</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Threshold</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">Loading...</td></tr>
            ) : ingredients.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">No ingredients added yet</td></tr>
            ) : (
              ingredients.map((item) => {
                const qty = parseFloat(item.stock?.quantity || 0);
                const threshold = parseFloat(item.lowStockThreshold || 10);
                const isLow = qty <= threshold;
                return (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                    <td className="px-4 py-3 text-gray-500">{item.category || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{item.unit}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{qty}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{threshold}</td>
                    <td className="px-4 py-3">
                      {isLow ? <span className="badge-red">Low Stock</span> : <span className="badge-green">OK</span>}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showRestock && <RestockModal onClose={() => setShowRestock(false)} />}
    </div>
  );
}
