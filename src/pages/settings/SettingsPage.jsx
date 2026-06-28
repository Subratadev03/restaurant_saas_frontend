import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth.store.js';
import { restaurantService } from '../../services/auth.service.js';
import { useThemeStore, THEMES } from '../../store/theme.store.js';
import toast from 'react-hot-toast';
import { Settings, Store, Users, Percent, ToggleLeft, ToggleRight, Palette, Check } from 'lucide-react';

const TABS = [
  { id: 'profile',  label: 'Restaurant Profile',   icon: Store    },
  { id: 'features', label: 'Features & Services',  icon: ToggleLeft },
  { id: 'taxes',    label: 'Taxes & Charges',      icon: Percent  },
  { id: 'staff',    label: 'Staff Management',     icon: Users    },
  { id: 'theme',    label: 'Theme & Appearance',   icon: Palette  },
];

function ProfileTab({ restaurant, onSave }) {
  const [form, setForm] = useState({
    name: restaurant?.name || '',
    phone: restaurant?.phone || '',
    address: restaurant?.address || '',
    city: restaurant?.city || '',
    timezone: restaurant?.timezone || 'Asia/Kolkata',
    currency: restaurant?.currency || 'INR',
  });

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">Restaurant Profile</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Restaurant Name</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="col-span-2">
          <label className="label">Address</label>
          <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <div>
          <label className="label">City</label>
          <input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </div>
        <div>
          <label className="label">Timezone</label>
          <input className="input" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
        </div>
        <div>
          <label className="label">Currency</label>
          <select className="input" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
          </select>
        </div>
      </div>
      <button onClick={() => onSave(form)} className="btn-primary">Save Changes</button>
    </div>
  );
}

function ToggleRow({ label, description, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div>
        <p className="font-medium text-gray-900 text-sm">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <button onClick={() => onChange(!value)} className="flex-shrink-0">
        {value ? (
          <ToggleRight className="w-8 h-8 text-brand-500" />
        ) : (
          <ToggleLeft className="w-8 h-8 text-gray-300" />
        )}
      </button>
    </div>
  );
}

function FeaturesTab({ settings, onSave }) {
  const [s, setS] = useState({
    posEnabled: settings?.posEnabled ?? true,
    onlineOrderingEnabled: settings?.onlineOrderingEnabled ?? false,
    loyaltyEnabled: settings?.loyaltyEnabled ?? false,
  });

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">Feature Toggles</h3>
      <div className="card">
        <ToggleRow label="POS Billing" description="Enable point-of-sale billing module" value={s.posEnabled} onChange={(v) => setS({ ...s, posEnabled: v })} />
        <ToggleRow label="Online Ordering" description="Accept orders from your digital menu" value={s.onlineOrderingEnabled} onChange={(v) => setS({ ...s, onlineOrderingEnabled: v })} />
        <ToggleRow label="Loyalty Program" description="Earn and redeem points for customers" value={s.loyaltyEnabled} onChange={(v) => setS({ ...s, loyaltyEnabled: v })} />
      </div>
      <button onClick={() => onSave(s)} className="btn-primary">Save Settings</button>
    </div>
  );
}

function TaxTab({ settings, onSave }) {
  const [s, setS] = useState({
    taxRate: settings?.taxRate ?? 5,
    serviceCharge: settings?.serviceCharge ?? 0,
  });

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">Taxes & Charges</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Tax Rate (%)</label>
          <input type="number" className="input" min="0" max="100" step="0.5" value={s.taxRate} onChange={(e) => setS({ ...s, taxRate: parseFloat(e.target.value) })} />
        </div>
        <div>
          <label className="label">Service Charge (%)</label>
          <input type="number" className="input" min="0" max="100" step="0.5" value={s.serviceCharge} onChange={(e) => setS({ ...s, serviceCharge: parseFloat(e.target.value) })} />
        </div>
      </div>
      <button onClick={() => onSave(s)} className="btn-primary">Save</button>
    </div>
  );
}

// ─── Theme Tab ───────────────────────────────────────────────────────────────
function ThemeTab() {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">Color Theme</h3>
        <p className="text-sm text-gray-500 mb-5">Choose an accent color for the entire portal. Changes apply instantly.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                theme === t.id
                  ? 'border-gray-900 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Swatch */}
              <div
                className="w-12 h-12 rounded-xl shadow-sm"
                style={{ backgroundColor: t.swatch }}
              />
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-900">{t.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{t.description}</p>
              </div>
              {/* Check mark */}
              {theme === t.id && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-gray-900 text-white rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Live preview strip */}
      <div className="rounded-xl border border-gray-200 p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Preview</p>
        <div className="flex flex-wrap gap-3 items-center">
          <button className="btn-primary text-sm py-2 px-4">Primary Button</button>
          <button className="btn-secondary text-sm py-2 px-4">Secondary Button</button>
          <span className="text-brand-600 font-semibold text-sm">Brand Text</span>
          <div className="w-6 h-6 rounded bg-brand-500" />
          <div className="w-6 h-6 rounded bg-brand-100" />
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const { restaurant } = useAuthStore();
  const qc = useQueryClient();

  const updateProfile = useMutation({
    mutationFn: (data) => restaurantService.update(restaurant.id, data),
    onSuccess: () => { toast.success('Profile updated'); qc.invalidateQueries(['restaurant']); },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  });

  const updateSettings = useMutation({
    mutationFn: (data) => restaurantService.updateSettings(restaurant.id, data),
    onSuccess: () => toast.success('Settings saved'),
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  });

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-5">
        <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-brand-500" />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500">{restaurant?.name}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        {/* Tab navigation */}
        <div className="sm:w-52 flex-shrink-0">
          <nav className="flex sm:flex-col gap-1 overflow-x-auto sm:overflow-visible pb-1 sm:pb-0">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-shrink-0 sm:flex-shrink flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-left whitespace-nowrap ${
                  activeTab === id ? 'bg-brand-50 text-brand-600' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab content */}
        <div className="flex-1 card">
          {activeTab === 'profile' && (
            <ProfileTab restaurant={restaurant} onSave={(data) => updateProfile.mutate(data)} />
          )}
          {activeTab === 'features' && (
            <FeaturesTab settings={restaurant?.settings} onSave={(data) => updateSettings.mutate(data)} />
          )}
          {activeTab === 'taxes' && (
            <TaxTab settings={restaurant?.settings} onSave={(data) => updateSettings.mutate(data)} />
          )}
          {activeTab === 'staff' && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Staff Management</h3>
              <p className="text-sm text-gray-500">Use the API to manage staff members and their roles.</p>
            </div>
          )}
          {activeTab === 'theme' && <ThemeTab />}
        </div>
      </div>
    </div>
  );
}
