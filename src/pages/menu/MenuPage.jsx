import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { menuService, inventoryService } from '../../services/index.js';
import toast from 'react-hot-toast';
import {
  UtensilsCrossed, Plus, Pencil, Trash2, X, ChevronDown,
  ChevronUp, ToggleLeft, ToggleRight, BookOpen, Leaf, Clock,
  Flame, Tag,
} from 'lucide-react';

// ─────────────────────────────────────────────
// Menu Item Form Modal
// ─────────────────────────────────────────────
const EMPTY_FORM = {
  name: '', description: '', category: '', price: '',
  imageUrl: '', isVeg: false, isAvailable: true,
  preparationTime: '', calories: '', tags: '', sortOrder: 0,
};

function ItemModal({ item, onClose }) {
  const qc = useQueryClient();
  const isEdit = !!item;
  const [form, setForm] = useState(
    isEdit
      ? { ...item, price: item.price, tags: (item.tags || []).join(', '), preparationTime: item.preparationTime || '', calories: item.calories || '' }
      : EMPTY_FORM
  );

  const save = useMutation({
    mutationFn: (data) => isEdit ? menuService.update(item.id, data) : menuService.create(data),
    onSuccess: () => {
      toast.success(isEdit ? 'Item updated' : 'Item created');
      qc.invalidateQueries({ queryKey: ['menu-items'] });
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Save failed'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    save.mutate({
      name:            form.name,
      description:     form.description || undefined,
      category:        form.category,
      price:           parseFloat(form.price),
      imageUrl:        form.imageUrl || undefined,
      isVeg:           form.isVeg,
      isAvailable:     form.isAvailable,
      preparationTime: form.preparationTime ? parseInt(form.preparationTime) : undefined,
      calories:        form.calories ? parseInt(form.calories) : undefined,
      tags:            form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      sortOrder:       parseInt(form.sortOrder) || 0,
    });
  };

  const field = (key, label, type = 'text', props = {}) => (
    <div>
      <label className="label">{label}</label>
      <input
        type={type} className="input" value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        {...props}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Menu Item' : 'Add Menu Item'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field('name', 'Item Name *', 'text', { required: true, placeholder: 'e.g. Margherita Pizza' })}
            {field('category', 'Category *', 'text', { required: true, placeholder: 'e.g. Pizza, Burgers…' })}
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              className="input h-20 resize-none"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Short description of the item"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {field('price', 'Price (₹) *', 'number', { required: true, min: '0', step: '0.01', placeholder: '299' })}
            {field('preparationTime', 'Prep Time (min)', 'number', { min: '1', placeholder: '15' })}
            {field('calories', 'Calories (kcal)', 'number', { min: '0', placeholder: '450' })}
          </div>

          {field('imageUrl', 'Image URL', 'url', { placeholder: 'https://example.com/image.jpg' })}
          {field('tags', 'Tags (comma separated)', 'text', { placeholder: 'spicy, bestseller, new' })}

          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <button type="button" onClick={() => setForm({ ...form, isVeg: !form.isVeg })}>
                {form.isVeg
                  ? <ToggleRight className="w-8 h-8 text-green-500" />
                  : <ToggleLeft  className="w-8 h-8 text-gray-300" />}
              </button>
              <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Leaf className="w-4 h-4 text-green-500" /> Vegetarian
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <button type="button" onClick={() => setForm({ ...form, isAvailable: !form.isAvailable })}>
                {form.isAvailable
                  ? <ToggleRight className="w-8 h-8 text-brand-500" />
                  : <ToggleLeft  className="w-8 h-8 text-gray-300" />}
              </button>
              <span className="text-sm font-medium text-gray-700">Available</span>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={save.isPending} className="btn-primary flex-1">
              {save.isPending ? 'Saving…' : isEdit ? 'Update Item' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Recipe Editor Modal  (dropdown + inline new-ingredient textbox)
// ─────────────────────────────────────────────
function RecipeModal({ item, onClose }) {
  const qc = useQueryClient();

  const { data: recipeData, isLoading: loadingRecipe } = useQuery({
    queryKey: ['recipe', item.id],
    queryFn: () => menuService.getRecipe(item.id),
    select: (r) => r.data?.data?.recipe ?? [],
  });

  const { data: ingredientsData, refetch: refetchIngredients } = useQuery({
    queryKey: ['ingredients'],
    queryFn: () => inventoryService.listIngredients(),
    select: (r) => r.data?.data ?? [],
  });

  // rows: each row = { ingredientId, quantityRequired, unit, _mode: 'select'|'new', _newName, _newUnit }
  const [rows, setRows] = useState(null);
  const [addingNew, setAddingNew] = useState(false); // quick-create ingredient panel
  const [newIng, setNewIng] = useState({ name: '', unit: 'g', costPerUnit: '' });

  const ingredients = ingredientsData ?? [];

  const currentRows = rows ?? (recipeData
    ? recipeData.map((r) => ({ ingredientId: r.ingredientId, quantityRequired: r.quantityRequired, _mode: 'select' }))
    : []);

  const addRow = () => setRows([...currentRows, { ingredientId: '', quantityRequired: '', _mode: 'select' }]);
  const removeRow = (i) => setRows(currentRows.filter((_, idx) => idx !== i));
  const updateRow = (i, key, val) => {
    const updated = [...currentRows];
    updated[i] = { ...updated[i], [key]: val };
    setRows(updated);
  };

  // quick-create a new ingredient via inventory service
  const createIngredient = useMutation({
    mutationFn: (data) => inventoryService.createIngredient(data),
    onSuccess: (res) => {
      const created = res.data?.data;
      toast.success(`Ingredient "${created.name}" created`);
      refetchIngredients();
      // append a row pre-filled with the new ingredient
      setRows([...currentRows, { ingredientId: created.id, quantityRequired: '', _mode: 'select' }]);
      setNewIng({ name: '', unit: 'g', costPerUnit: '' });
      setAddingNew(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create ingredient'),
  });

  const saveRecipe = useMutation({
    mutationFn: (data) => menuService.setRecipe(item.id, data),
    onSuccess: () => {
      toast.success('Recipe saved');
      qc.invalidateQueries({ queryKey: ['recipe', item.id] });
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Save failed'),
  });

  const handleSave = () => {
    const validRows = currentRows.filter((r) => r.ingredientId && r.quantityRequired);
    if (validRows.length === 0) return toast.error('Add at least one ingredient');
    saveRecipe.mutate({ ingredients: validRows.map((r) => ({ ingredientId: r.ingredientId, quantityRequired: parseFloat(r.quantityRequired) })) });
  };

  const UNITS = ['g', 'kg', 'ml', 'L', 'pcs', 'tbsp', 'tsp', 'cup', 'oz', 'lb'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Recipe</h2>
            <p className="text-sm text-gray-500">{item.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4">
          {loadingRecipe ? (
            <p className="text-center text-gray-400 py-6">Loading recipe…</p>
          ) : (
            <>
              {currentRows.length === 0 && !addingNew && (
                <p className="text-center text-gray-400 text-sm py-4">No recipe yet. Add ingredients below.</p>
              )}

              {/* Column headers */}
              {currentRows.length > 0 && (
                <div className="flex gap-2 text-xs font-semibold text-gray-400 px-1">
                  <span className="flex-1">Ingredient</span>
                  <span className="w-28">Qty</span>
                  <span className="w-5" />
                </div>
              )}

              <div className="space-y-2">
                {currentRows.map((row, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    {/* Ingredient selector or free-text */}
                    <div className="flex-1 relative">
                      <select
                        className="input text-sm pr-8"
                        value={row.ingredientId}
                        onChange={(e) => updateRow(i, 'ingredientId', e.target.value)}
                      >
                        <option value="">— select ingredient —</option>
                        {ingredients.map((ing) => (
                          <option key={ing.id} value={ing.id}>
                            {ing.name} ({ing.unit})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-28">
                      <input
                        type="number" min="0.001" step="0.001"
                        className="input text-sm"
                        placeholder="Qty"
                        value={row.quantityRequired}
                        onChange={(e) => updateRow(i, 'quantityRequired', e.target.value)}
                      />
                    </div>
                    <button onClick={() => removeRow(i)} className="text-red-400 hover:text-red-600 flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Quick-create new ingredient panel */}
              {addingNew ? (
                <div className="border border-dashed border-brand-300 rounded-xl p-4 bg-brand-50 space-y-3">
                  <p className="text-sm font-semibold text-brand-700">New Ingredient</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="label text-xs">Name *</label>
                      <input
                        className="input text-sm"
                        placeholder="e.g. Tomato"
                        value={newIng.name}
                        onChange={(e) => setNewIng({ ...newIng, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label text-xs">Unit *</label>
                      <select className="input text-sm" value={newIng.unit} onChange={(e) => setNewIng({ ...newIng, unit: e.target.value })}>
                        {UNITS.map((u) => <option key={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="label text-xs">Cost per unit (₹)</label>
                    <input
                      type="number" min="0" step="0.01"
                      className="input text-sm"
                      placeholder="0.00"
                      value={newIng.costPerUnit}
                      onChange={(e) => setNewIng({ ...newIng, costPerUnit: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="btn-secondary flex-1 text-sm"
                      onClick={() => { setAddingNew(false); setNewIng({ name: '', unit: 'g', costPerUnit: '' }); }}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn-primary flex-1 text-sm"
                      disabled={!newIng.name || createIngredient.isPending}
                      onClick={() => createIngredient.mutate({ name: newIng.name.trim(), unit: newIng.unit, costPerUnit: newIng.costPerUnit ? parseFloat(newIng.costPerUnit) : undefined })}
                    >
                      {createIngredient.isPending ? 'Creating…' : 'Create & Add'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={addRow} className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm">
                    <Plus className="w-4 h-4" /> Add from List
                  </button>
                  <button
                    onClick={() => setAddingNew(true)}
                    className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm text-brand-600 border-brand-200 hover:border-brand-400"
                  >
                    <Plus className="w-4 h-4" /> New Ingredient
                  </button>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleSave} disabled={saveRecipe.isPending} className="btn-primary flex-1">
                  {saveRecipe.isPending ? 'Saving…' : 'Save Recipe'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Menu Item Card
// ─────────────────────────────────────────────
function MenuItemCard({ item, onEdit, onRecipe, onDelete, onToggle }) {
  return (
    <div className={`card p-4 transition-all ${!item.isAvailable ? 'opacity-60' : ''}`}>
      <div className="flex gap-3">
        {/* Image or placeholder */}
        <div className="w-16 h-16 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden">
          {item.imageUrl
            ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                {item.isVeg && <Leaf className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />}
                {!item.isAvailable && <span className="badge-red text-xs">Unavailable</span>}
              </div>
              <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{item.description || '—'}</p>
            </div>
            <p className="text-brand-600 font-bold text-sm whitespace-nowrap">₹{item.price}</p>
          </div>

          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            {item.preparationTime && (
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{item.preparationTime}m</span>
            )}
            {item.calories && (
              <span className="flex items-center gap-1"><Flame className="w-3 h-3" />{item.calories} kcal</span>
            )}
            {item.tags?.length > 0 && (
              <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{item.tags.slice(0,2).join(', ')}</span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1.5 mt-3 pt-3 border-t border-gray-100">
        <button onClick={() => onEdit(item)} className="btn-secondary flex-1 text-xs py-1.5 flex items-center justify-center gap-1">
          <Pencil className="w-3 h-3" /> Edit
        </button>
        <button onClick={() => onRecipe(item)} className="btn-secondary flex-1 text-xs py-1.5 flex items-center justify-center gap-1">
          <BookOpen className="w-3 h-3" /> Recipe
        </button>
        <button
          onClick={() => onToggle(item.id)}
          className="btn-secondary flex-1 text-xs py-1.5 flex items-center justify-center gap-1"
        >
          {item.isAvailable
            ? <ToggleRight className="w-3.5 h-3.5 text-green-500" />
            : <ToggleLeft  className="w-3.5 h-3.5 text-gray-400" />}
          {item.isAvailable ? 'On' : 'Off'}
        </button>
        <button onClick={() => onDelete(item.id)} className="text-red-400 hover:text-red-600 px-2 hover:bg-red-50 rounded-lg transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function MenuPage() {
  const qc = useQueryClient();
  const [editItem, setEditItem]       = useState(null);
  const [recipeItem, setRecipeItem]   = useState(null);
  const [showAdd, setShowAdd]         = useState(false);
  const [activeCategory, setCategory] = useState('All');
  const [search, setSearch]           = useState('');
  const [collapsed, setCollapsed]     = useState({});

  const { data, isLoading } = useQuery({
    queryKey: ['menu-items', search],
    queryFn:  () => menuService.list(search ? { search } : {}),
    select:   (r) => r.data?.data,
  });

  const deleteItem = useMutation({
    mutationFn: (id) => menuService.delete(id),
    onSuccess: () => { toast.success('Item deleted'); qc.invalidateQueries({ queryKey: ['menu-items'] }); },
    onError:   (err) => toast.error(err.response?.data?.message || 'Delete failed'),
  });

  const toggleItem = useMutation({
    mutationFn: (id) => menuService.toggle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['menu-items'] }),
    onError:   (err) => toast.error(err.response?.data?.message || 'Toggle failed'),
  });

  const confirmDelete = (id) => {
    if (window.confirm('Delete this menu item?')) deleteItem.mutate(id);
  };

  const items      = data?.items ?? [];
  const grouped    = data?.grouped ?? {};
  const categories = ['All', ...(data?.categories ?? [])];

  const filteredItems = activeCategory === 'All'
    ? items
    : (grouped[activeCategory] ?? []);

  const totalItems     = items.length;
  const availableItems = items.filter((i) => i.isAvailable).length;

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <UtensilsCrossed className="w-5 h-5 sm:w-6 sm:h-6 text-brand-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
            <p className="text-sm text-gray-500">{availableItems}/{totalItems} items available</p>
          </div>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {/* Search + Category filter */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <input
          className="input w-64 text-sm"
          placeholder="Search items…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-brand-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-300'
              }`}
            >
              {cat}
              {cat !== 'All' && grouped[cat] && (
                <span className="ml-1.5 text-xs opacity-70">({grouped[cat].length})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Items */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-400">Loading menu…</div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">No items found</p>
          <p className="text-sm mt-1">Add your first menu item to get started</p>
          <button onClick={() => setShowAdd(true)} className="btn-primary mt-4">
            <Plus className="w-4 h-4 inline mr-1" /> Add Item
          </button>
        </div>
      ) : activeCategory === 'All' ? (
        // Show grouped by category
        Object.entries(grouped).map(([cat, catItems]) => (
          <div key={cat} className="mb-8">
            <button
              onClick={() => setCollapsed((c) => ({ ...c, [cat]: !c[cat] }))}
              className="flex items-center gap-2 mb-3 group"
            >
              <h2 className="font-bold text-gray-800 text-lg">{cat}</h2>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{catItems.length}</span>
              {collapsed[cat] ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
            </button>
            {!collapsed[cat] && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {catItems.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onEdit={setEditItem}
                    onRecipe={setRecipeItem}
                    onDelete={confirmDelete}
                    onToggle={(id) => toggleItem.mutate(id)}
                  />
                ))}
              </div>
            )}
          </div>
        ))
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              onEdit={setEditItem}
              onRecipe={setRecipeItem}
              onDelete={confirmDelete}
              onToggle={(id) => toggleItem.mutate(id)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showAdd  && <ItemModal onClose={() => setShowAdd(false)} />}
      {editItem && <ItemModal item={editItem} onClose={() => setEditItem(null)} />}
      {recipeItem && <RecipeModal item={recipeItem} onClose={() => setRecipeItem(null)} />}
    </div>
  );
}
