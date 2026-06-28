import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../../services/order.service.js';
import { posService, menuService, customerService, tableService } from '../../services/index.js';
import { useOrderStore } from '../../store/order.store.js';
import { useAuthStore } from '../../store/auth.store.js';
import toast from 'react-hot-toast';
import { Plus, Minus, Trash2, ShoppingCart, CreditCard, Tag, Leaf, User, X, Phone, Utensils, Package, Truck, Globe, UtensilsCrossed } from 'lucide-react';

const PAYMENT_METHODS = ['cash', 'card', 'upi', 'wallet'];

// ── Inline customer lookup / quick-create ─────────────────────────────────────
function fullName(c) {
  return c ? `${c.firstName}${c.lastName ? ' ' + c.lastName : ''}` : '';
}

function CustomerSelector({ value, onChange, required }) {
  const [search, setSearch]   = useState('');
  const [open, setOpen]       = useState(false);
  const [adding, setAdding]   = useState(false);
  const [newCust, setNewCust] = useState({ firstName: '', lastName: '', phone: '', email: '' });
  const containerRef          = useRef(null);
  const qc = useQueryClient();

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['customer-search', search],
    queryFn:  () => customerService.list({ search, limit: 8 }),
    select:   (r) => r.data?.data ?? [],
    enabled:  search.length >= 2 && !value,
  });

  const createCustomer = useMutation({
    mutationFn: (data) => customerService.create(data),
    onSuccess: (res) => {
      const c = res.data?.data;
      onChange(c);
      setSearch(fullName(c));
      setAdding(false);
      setOpen(false);
      setNewCust({ firstName: '', lastName: '', phone: '', email: '' });
      toast.success('Customer created & linked');
      qc.invalidateQueries({ queryKey: ['customer-search'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create customer'),
  });

  const select = (c) => {
    onChange(c);
    setSearch(fullName(c));
    setOpen(false);
    setAdding(false);
  };

  const clear = () => {
    onChange(null);
    setSearch('');
    setAdding(false);
  };

  // Close only when focus leaves the entire component (not when moving between inner inputs)
  const handleBlur = () => {
    setTimeout(() => {
      if (containerRef.current && !containerRef.current.contains(document.activeElement)) {
        setOpen(false);
        // If user hasn't selected anyone and was adding, collapse the add form
        if (!value) setAdding(false);
      }
    }, 0);
  };

  const hasError = required && !value;

  return (
    <div ref={containerRef} className="relative" onBlur={handleBlur}>
      <label className={`label text-xs font-semibold ${hasError ? 'text-red-500' : ''}`}>
        Customer Name &amp; Mobile *
      </label>
      <div className="relative">
        <User className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
        <input
          className={`input text-sm pl-7 pr-7 ${hasError ? 'border-red-400 focus:ring-red-300' : ''}`}
          placeholder="Search by name or phone…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); if (value) onChange(null); }}
          onFocus={() => setOpen(true)}
          autoComplete="off"
        />
        {value ? (
          <button
            type="button"
            onClick={clear}
            className="absolute right-2 top-2.5 text-gray-400 hover:text-red-400"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : isFetching ? (
          <span className="absolute right-2.5 top-2.5 w-3.5 h-3.5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
        ) : null}
      </div>

      {/* Dropdown panel — stays open while any inner element has focus */}
      {open && !value && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">

          {/* Search results */}
          {results.length > 0 && (
            <ul className="max-h-44 overflow-auto divide-y divide-gray-50">
              {results.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); select(c); }}
                    className="w-full text-left px-3 py-2.5 hover:bg-brand-50 text-sm"
                  >
                    <span className="font-semibold text-gray-900">{fullName(c)}</span>
                    {c.phone && (
                      <span className="text-gray-400 ml-2 text-xs">
                        <Phone className="w-3 h-3 inline mr-0.5" />{c.phone}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {search.length >= 2 && results.length === 0 && !isFetching && (
            <p className="px-3 py-2 text-xs text-gray-400">No customers found for "{search}"</p>
          )}

          {/* Toggle: show add form or show "New customer" button */}
          {!adding ? (
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); setAdding(true); }}
              className="w-full text-left px-3 py-2.5 text-xs text-brand-600 font-semibold hover:bg-brand-50 border-t border-gray-100 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> New customer
            </button>
          ) : (
            <div className="p-3 space-y-2 border-t border-gray-100 bg-gray-50">
              <p className="text-xs font-semibold text-gray-600 mb-1">New Customer</p>
              <input
                className="input text-xs py-1.5 w-full"
                placeholder="First name *"
                value={newCust.firstName}
                onChange={(e) => setNewCust((p) => ({ ...p, firstName: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  className="input text-xs py-1.5"
                  placeholder="Last name"
                  value={newCust.lastName}
                  onChange={(e) => setNewCust((p) => ({ ...p, lastName: e.target.value }))}
                />
                <input
                  className="input text-xs py-1.5"
                  placeholder="Mobile *"
                  value={newCust.phone}
                  onChange={(e) => setNewCust((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>
              <input
                className="input text-xs py-1.5 w-full"
                placeholder="Email (optional)"
                value={newCust.email}
                onChange={(e) => setNewCust((p) => ({ ...p, email: e.target.value }))}
              />
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); setAdding(false); setNewCust({ firstName: '', lastName: '', phone: '', email: '' }); }}
                  className="btn-secondary flex-1 text-xs py-1.5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!newCust.firstName.trim() || !newCust.phone.trim() || createCustomer.isPending}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    createCustomer.mutate({
                      firstName: newCust.firstName.trim(),
                      lastName:  newCust.lastName.trim() || undefined,
                      phone:     newCust.phone.trim(),
                      email:     newCust.email.trim() || undefined,
                    });
                  }}
                  className="btn-primary flex-1 text-xs py-1.5 disabled:opacity-50"
                >
                  {createCustomer.isPending ? 'Saving…' : 'Save & Link'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Linked customer confirmation pill */}
      {value && (
        <div className="mt-1.5 flex items-center gap-2 text-xs bg-green-50 border border-green-200 text-green-800 px-3 py-1.5 rounded-lg">
          <User className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
          <span className="font-semibold">{fullName(value)}</span>
          {value.phone && <span className="text-green-600">· {value.phone}</span>}
          <button type="button" onClick={clear} className="ml-auto text-green-500 hover:text-red-400">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

const ORDER_TYPES = [
  { value: 'dine_in',  label: 'Dine In',  icon: Utensils },
  { value: 'takeaway', label: 'Takeaway', icon: Package  },
  { value: 'delivery', label: 'Delivery', icon: Truck    },
  { value: 'online',   label: 'Online',   icon: Globe    },
];

export default function POSPage() {
  const qc = useQueryClient();
  const { restaurant } = useAuthStore();
  const {
    cart, addItem, removeItem, updateQuantity, clearCart, total,
    tableNumber, tableId, orderType, setTableNumber, setTableId, setOrderType,
  } = useOrderStore();

  const [discountCode, setDiscountCode]     = useState('');
  const [paymentMethod, setPaymentMethod]   = useState('cash');
  const [activeCategory, setActiveCategory] = useState('All');
  const [customer, setCustomer]             = useState(null);
  // Mobile: toggle between 'menu' and 'cart' tab
  const [mobileTab, setMobileTab]           = useState('menu');

  // Load live menu items
  const { data: menuData, isLoading: loadingMenu } = useQuery({
    queryKey: ['menu-items', 'pos'],
    queryFn:  () => menuService.list({ available: 'true' }),
    select:   (r) => r.data?.data,
  });

  // Load available tables for dine-in
  const { data: tables = [] } = useQuery({
    queryKey: ['tables', 'pos'],
    queryFn:  () => tableService.getTables({ active: 'true' }),
    select:   (r) => r.data?.data ?? [],
    enabled:  orderType === 'dine_in',
  });

  // Fetch taxes
  const { data: taxes = [] } = useQuery({
    queryKey: ['taxes'],
    queryFn:  () => posService.listTaxes(),
    select:   (r) => r.data?.data ?? [],
  });

  const menuItems  = menuData?.items ?? [];
  const grouped    = menuData?.grouped ?? {};
  const categories = ['All', ...(menuData?.categories ?? [])];
  const visibleItems = activeCategory === 'All' ? menuItems : (grouped[activeCategory] ?? []);

  const subtotal   = total();
  const taxAmount  = taxes.length
    ? parseFloat(taxes.reduce((s, t) => s + (subtotal * t.rate) / 100, 0).toFixed(2))
    : parseFloat((subtotal * 0.05).toFixed(2));
  const grandTotal = subtotal + taxAmount;

  const handleOrderTypeChange = (type) => {
    setOrderType(type);
    if (type !== 'dine_in') { setTableNumber(''); setTableId(null); }
  };

  const handleTableSelect = (e) => {
    const selected = tables.find((t) => t.id === e.target.value);
    if (selected) { setTableId(selected.id); setTableNumber(selected.tableNumber); }
    else          { setTableId(null); setTableNumber(''); }
  };

  const isDineIn   = orderType === 'dine_in';
  const tableError = isDineIn && !tableId;

  const createOrder = useMutation({
    mutationFn: (data) => orderService.create(data),
    onSuccess: async (res) => {
      const order = res.data?.data;
      try {
        await posService.generateInvoice({
          orderId: order.id,
          subtotal: parseFloat(order.subtotal),
          discountCode: discountCode || undefined,
          paymentMethod,
        });
        toast.success(`Order #${order.orderNumber} placed & invoice generated!`);
      } catch {
        toast.success(`Order #${order.orderNumber} placed!`);
      }
      clearCart();
      setDiscountCode('');
      setCustomer(null);
      setMobileTab('menu');
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['tables', 'pos'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to place order'),
  });

  const placeOrder = () => {
    if (cart.length === 0)      return toast.error('Cart is empty');
    if (!customer)              return toast.error('Please select or add a customer');
    if (isDineIn && !tableId)   return toast.error('Please select a table for dine-in orders');
    createOrder.mutate({
      type:        orderType,
      tableNumber: tableNumber || undefined,
      tableId:     tableId    || undefined,
      customerId:  customer.id,
      items: cart.map(({ menuItemId, menuItemName, quantity, unitPrice }) => ({
        menuItemId, menuItemName, quantity, unitPrice,
      })),
    });
  };

  // ── Shared cart sidebar contents ─────────────────────────────────────────
  const CartPanel = (
    <>
      <div className="p-4 border-b border-gray-100 space-y-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-gray-700" />
          <h2 className="font-bold text-gray-900">Current Order</h2>
          {cart.length > 0 && (
            <span className="ml-auto text-xs bg-brand-500 text-white rounded-full px-2 py-0.5">{cart.length}</span>
          )}
        </div>

        {/* Order Type */}
        <div>
          <label className="label text-xs font-semibold">Order Type</label>
          <div className="grid grid-cols-4 gap-1">
            {ORDER_TYPES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => handleOrderTypeChange(value)}
                className={`flex flex-col items-center gap-0.5 py-2 rounded-xl border text-xs font-medium transition-all ${
                  orderType === value
                    ? 'bg-brand-500 border-brand-500 text-white'
                    : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-brand-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Table (dine-in only) */}
        {isDineIn && (
          <div>
            <label className={`label text-xs font-semibold ${tableError ? 'text-red-500' : ''}`}>
              Table * <span className="font-normal text-gray-400">(required)</span>
            </label>
            <select
              className={`input text-sm ${tableError ? 'border-red-400' : ''}`}
              value={tableId || ''}
              onChange={handleTableSelect}
            >
              <option value="">— select a table —</option>
              {tables.map((t) => (
                <option key={t.id} value={t.id} disabled={t.status === 'occupied' || t.status === 'inactive'}>
                  {t.tableNumber}{t.tableName ? ` — ${t.tableName}` : ''} ({t.tableType?.replace('_', ' ')}) · {t.capacity} seats{t.status !== 'available' ? ` [${t.status}]` : ''}
                </option>
              ))}
            </select>
            {tableId && (
              <div className="mt-1 flex items-center gap-1.5 text-xs text-brand-700 bg-brand-50 px-2 py-1 rounded-lg">
                <Utensils className="w-3 h-3" />
                {(() => { const t = tables.find((x) => x.id === tableId); return t ? `Table ${t.tableNumber}${t.tableName ? ' — ' + t.tableName : ''} · ${t.tableType?.replace('_', ' ')}` : tableNumber; })()}
              </div>
            )}
          </div>
        )}

        {/* Customer */}
        <CustomerSelector value={customer} onChange={setCustomer} required={true} />
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {cart.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Add items to start an order</p>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.menuItemId} className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{item.menuItemName}</p>
                <p className="text-xs text-gray-500">₹{item.unitPrice} each</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)} className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center hover:bg-gray-200"><Minus className="w-3 h-3" /></button>
                <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)} className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center hover:bg-gray-200"><Plus className="w-3 h-3" /></button>
                <button onClick={() => removeItem(item.menuItemId)} className="w-6 h-6 rounded flex items-center justify-center text-red-400 hover:text-red-600 ml-1"><Trash2 className="w-3 h-3" /></button>
              </div>
              <span className="text-sm font-semibold text-gray-900 w-14 text-right">₹{(item.unitPrice * item.quantity).toFixed(0)}</span>
            </div>
          ))
        )}
      </div>

      {/* Checkout */}
      {cart.length > 0 && (
        <div className="p-4 border-t border-gray-100 space-y-3 flex-shrink-0">
          <div className="relative">
            <Tag className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
            <input className="input text-sm pl-7" placeholder="Discount code" value={discountCode} onChange={(e) => setDiscountCode(e.target.value.toUpperCase())} />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {PAYMENT_METHODS.map((m) => (
              <button key={m} onClick={() => setPaymentMethod(m)} className={`flex-1 text-xs py-1.5 rounded-lg font-medium capitalize transition-colors ${paymentMethod === m ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{m}</button>
            ))}
          </div>
          <div className="space-y-1 pt-1 border-t border-gray-100 text-sm">
            <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-gray-500"><span>Tax {taxes.length ? `(${taxes.map((t) => `${t.rate}%`).join('+')})` : '(5%)'}</span><span>₹{taxAmount.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-100"><span>Total</span><span>₹{grandTotal.toFixed(2)}</span></div>
          </div>
          <button onClick={placeOrder} disabled={createOrder.isPending} className="btn-primary w-full flex items-center justify-center gap-2">
            <CreditCard className="w-4 h-4" />
            {createOrder.isPending ? 'Processing…' : `Place Order · ₹${grandTotal.toFixed(2)}`}
          </button>
          <button onClick={clearCart} className="btn-secondary w-full text-sm">Clear Cart</button>
        </div>
      )}
    </>
  );

  // ── Menu panel ────────────────────────────────────────────────────────────
  const MenuPanel = (
    <>
      <div className="px-4 pt-4 pb-3 flex-shrink-0">
        <h1 className="text-xl font-bold text-gray-900 mb-3 hidden sm:block">Point of Sale</h1>
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                activeCategory === cat ? 'bg-brand-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-auto px-4 pb-4">
        {loadingMenu ? (
          <div className="text-center py-16 text-gray-400">Loading menu…</div>
        ) : visibleItems.length === 0 ? (
          <div className="text-center py-16 text-gray-400"><p className="font-medium">No available items</p><p className="text-sm mt-1">Add items in Menu Management</p></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 mt-2">
            {visibleItems.map((item) => {
              const inCart = cart.find((c) => c.menuItemId === item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => { addItem({ menuItemId: item.id, menuItemName: item.name, unitPrice: parseFloat(item.price) }); }}
                  className={`card p-3 sm:p-4 text-left transition-all cursor-pointer ${inCart ? 'border-brand-400 shadow-md ring-1 ring-brand-200' : 'border-transparent hover:border-brand-300 hover:shadow-md'}`}
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-brand-100 flex items-center justify-center mb-2 sm:mb-3 overflow-hidden">
                    {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" /> : <span className="text-base sm:text-lg">🍽️</span>}
                  </div>
                  <p className="font-medium text-xs sm:text-sm text-gray-900 leading-tight">{item.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1">
                      <p className="text-brand-600 font-bold text-xs sm:text-sm">₹{item.price}</p>
                      {item.isVeg && <Leaf className="w-3 h-3 text-green-500" />}
                    </div>
                    {inCart && <span className="text-xs bg-brand-500 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold">{inCart.quantity}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* ── Desktop layout (lg+): side-by-side ─────────────────────────── */}
      <div className="hidden lg:flex h-full overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">{MenuPanel}</div>
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col overflow-hidden">{CartPanel}</div>
      </div>

      {/* ── Mobile / Tablet layout: tabbed ─────────────────────────────── */}
      <div className="lg:hidden flex flex-col h-full overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-gray-200 bg-white flex-shrink-0">
          <button
            onClick={() => setMobileTab('menu')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
              mobileTab === 'menu' ? 'text-brand-600 border-b-2 border-brand-500' : 'text-gray-500'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" /> Menu
          </button>
          <button
            onClick={() => setMobileTab('cart')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors relative ${
              mobileTab === 'cart' ? 'text-brand-600 border-b-2 border-brand-500' : 'text-gray-500'
            }`}
          >
            <ShoppingCart className="w-4 h-4" /> Cart
            {cart.length > 0 && (
              <span className="absolute top-2 right-[calc(50%-22px)] bg-brand-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">{cart.length}</span>
            )}
          </button>
        </div>

        {/* Tab content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          {mobileTab === 'menu' ? MenuPanel : CartPanel}
        </div>
      </div>
    </>
  );
}
