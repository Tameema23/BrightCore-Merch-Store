import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const API_BASE_URL = import.meta.env.VITE_API_URL
const PLACEHOLDER = 'https://placehold.co/80x80?text=No+Img'

function resolveImageUrl(imagePath) {
  if (!imagePath) return PLACEHOLDER
  if (/^https?:\/\//i.test(imagePath)) return imagePath
  return `${API_BASE_URL}${imagePath.startsWith('/') ? imagePath : '/' + imagePath}`
}

function getStockStatus(variants) {
  if (!variants || variants.length === 0) return { label: 'No Variants', bg: 'bg-gray-100', text: 'text-gray-500' }
  const totalStock = variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0)
  if (totalStock > 0) return { label: 'In Stock', bg: 'bg-green-100', text: 'text-green-700' }
  return { label: 'Out of Stock', bg: 'bg-red-100', text: 'text-red-600' }
}

export default function ProductAdminDashboard() {
  const { token, user } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Add/Edit Product modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null) // null = add mode, product obj = edit mode
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({ product_name: '', description: '', price: '', category_id: '' })
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  // Restock inline forms: { [productId]: { variantId, qty, submitting, error } }
  const [restockForms, setRestockForms] = useState({})

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/catalog/products/`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to fetch products')
        return r.json()
      })
      .then((data) => { setProducts(data); setLoading(false) })
      .catch((err) => { setError(err.message); setLoading(false) })
  }, [])

  function fetchCategories(prefillId) {
    fetch(`${API_BASE_URL}/api/catalog/categories/`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load categories')
        return r.json()
      })
      .then((data) => {
        setCategories(data)
        if (!prefillId && data.length > 0) {
          setForm((f) => ({ ...f, category_id: String(data[0].category_id) }))
        }
      })
      .catch(() => setFormError('Failed to load categories'))
  }

  function openModal() {
    setEditingProduct(null)
    setForm({ product_name: '', description: '', price: '', category_id: '' })
    setFormError('')
    setModalOpen(true)
    fetchCategories(null)
  }

  function openEditModal(product) {
    setEditingProduct(product)
    setForm({
      product_name: product.product_name,
      description: product.description || '',
      price: String(product.price),
      category_id: String(product.category?.category_id ?? ''),
    })
    setFormError('')
    setModalOpen(true)
    fetchCategories(product.category?.category_id)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingProduct(null)
  }

  function handleSave() {
    if (!form.product_name.trim() || !form.price || !form.category_id) {
      setFormError('Product name, price, and category are required.')
      return
    }
    setSaving(true)
    setFormError('')
    const body = JSON.stringify({
      product_name: form.product_name.trim(),
      description: form.description.trim(),
      price: parseFloat(form.price),
      category_id: parseInt(form.category_id, 10),
      product_admin_id: user.employee_id,
    })
    const url = editingProduct
      ? `${API_BASE_URL}/api/catalog/products/${editingProduct.product_id}/`
      : `${API_BASE_URL}/api/catalog/products/`
    const method = editingProduct ? 'PUT' : 'POST'
    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body,
    })
      .then((r) => r.json().then((data) => ({ ok: r.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          const msg = data.error || data.detail || Object.values(data).flat().join(', ') || 'Failed to save product'
          setFormError(msg)
          setSaving(false)
          return
        }
        if (editingProduct) {
          setProducts((prev) => prev.map((p) => (p.product_id === data.product_id ? data : p)))
        } else {
          setProducts((prev) => [data, ...prev])
        }
        closeModal()
        setSaving(false)
      })
      .catch(() => {
        setFormError('Network error. Please try again.')
        setSaving(false)
      })
  }

  function openRestockForm(product) {
    const firstVariant = product.variants?.[0]
    setRestockForms((prev) => ({
      ...prev,
      [product.product_id]: {
        variantId: firstVariant ? String(firstVariant.variant_id) : '',
        qty: '',
        submitting: false,
        error: '',
      },
    }))
  }

  function closeRestockForm(productId) {
    setRestockForms((prev) => {
      const next = { ...prev }
      delete next[productId]
      return next
    })
  }

  function handleRestock(product) {
    const form = restockForms[product.product_id]
    if (!form) return
    if (!form.variantId) {
      setRestockForms((prev) => ({ ...prev, [product.product_id]: { ...form, error: 'No variant available.' } }))
      return
    }
    const addQty = parseInt(form.qty, 10)
    if (isNaN(addQty) || addQty <= 0) {
      setRestockForms((prev) => ({ ...prev, [product.product_id]: { ...form, error: 'Enter a positive quantity.' } }))
      return
    }
    const variant = product.variants.find((v) => String(v.variant_id) === form.variantId)
    if (!variant) return
    const newQty = (variant.stock_quantity || 0) + addQty
    setRestockForms((prev) => ({ ...prev, [product.product_id]: { ...form, submitting: true, error: '' } }))
    fetch(`${API_BASE_URL}/api/catalog/variants/${form.variantId}/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ stock_quantity: newQty }),
    })
      .then((r) => r.json().then((data) => ({ ok: r.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          const msg = data.error || data.detail || 'Failed to restock'
          setRestockForms((prev) => ({ ...prev, [product.product_id]: { ...form, submitting: false, error: msg } }))
          return
        }
        setProducts((prev) =>
          prev.map((p) => {
            if (p.product_id !== product.product_id) return p
            return {
              ...p,
              variants: p.variants.map((v) =>
                String(v.variant_id) === form.variantId ? { ...v, stock_quantity: data.stock_quantity } : v
              ),
            }
          })
        )
        closeRestockForm(product.product_id)
      })
      .catch(() => {
        setRestockForms((prev) => ({ ...prev, [product.product_id]: { ...form, submitting: false, error: 'Network error. Please try again.' } }))
      })
  }

  function handleDelete(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return
    fetch(`${API_BASE_URL}/api/catalog/products/${productId}/`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to delete product')
        setProducts((prev) => prev.filter((p) => p.product_id !== productId))
      })
      .catch(() => alert('Failed to delete product'))
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center py-32">
      <p className="text-red-600 font-medium">{error}</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Products</h1>
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors hover:opacity-90 active:scale-95"
          style={{ backgroundColor: '#1e3a5f' }}
        >
          <Plus size={18} />
          Add Product
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {products.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No products found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-3">Product</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3">Stock</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((product) => {
                  const thumbnail = product.images?.[0]?.image_url
                  const stock = getStockStatus(product.variants)
                  const restockForm = restockForms[product.product_id]
                  return (
                    <>
                      <tr key={product.product_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={resolveImageUrl(thumbnail)}
                              alt={product.product_name}
                              onError={(e) => { if (e.currentTarget.src !== PLACEHOLDER) e.currentTarget.src = PLACEHOLDER }}
                              className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                            />
                            <span className="font-medium text-gray-900">{product.product_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{product.category?.category_name}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">${parseFloat(product.price).toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${stock.bg} ${stock.text}`}>
                            {stock.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => restockForm ? closeRestockForm(product.product_id) : openRestockForm(product)}
                              className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                              title="Restock"
                            >
                              <RefreshCw size={16} />
                            </button>
                            <button
                              onClick={() => openEditModal(product)}
                              className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Edit"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(product.product_id)}
                              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {restockForm && (
                        <tr key={`${product.product_id}-restock`}>
                          <td colSpan={5} className="px-6 py-4 bg-green-50 border-t border-green-100">
                            <div className="flex flex-wrap items-end gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Variant</label>
                                <select
                                  value={restockForm.variantId}
                                  onChange={(e) => setRestockForms((prev) => ({ ...prev, [product.product_id]: { ...restockForm, variantId: e.target.value, error: '' } }))}
                                  className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                                >
                                  {product.variants?.length === 0 && <option value="">No variants</option>}
                                  {product.variants?.map((v) => (
                                    <option key={v.variant_id} value={v.variant_id}>
                                      {v.size?.size_code ?? '—'} / {v.color?.color_name ?? '—'} (stock: {v.stock_quantity})
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Qty to add</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={restockForm.qty}
                                  onChange={(e) => setRestockForms((prev) => ({ ...prev, [product.product_id]: { ...restockForm, qty: e.target.value, error: '' } }))}
                                  className="w-24 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                  placeholder="0"
                                />
                              </div>
                              <button
                                onClick={() => handleRestock(product)}
                                disabled={restockForm.submitting}
                                className="px-4 py-1.5 rounded-md text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                              >
                                {restockForm.submitting ? 'Saving…' : 'Confirm'}
                              </button>
                              {restockForm.error && (
                                <p className="text-sm text-red-600">{restockForm.error}</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Add Product modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input
                  type="text"
                  value={form.product_name}
                  onChange={(e) => setForm((f) => ({ ...f, product_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. BrightCore Hoodie"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Optional description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {categories.length === 0 && <option value="">Loading…</option>}
                  {categories.map((c) => (
                    <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                  ))}
                </select>
              </div>

              {formError && (
                <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{formError}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                style={{ backgroundColor: '#1e3a5f' }}
              >
                {saving ? 'Saving…' : 'Save Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
