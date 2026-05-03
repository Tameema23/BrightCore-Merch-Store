import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const API_BASE_URL = import.meta.env.VITE_API_URL

export default function ManageCategoriesPage() {
  const { token } = useAuth()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [form, setForm] = useState({ category_name: '', category_description: '' })
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/catalog/categories/`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to fetch categories')
        return r.json()
      })
      .then((data) => { setCategories(data); setLoading(false) })
      .catch((err) => { setError(err.message); setLoading(false) })
  }, [token])

  function openModal() {
    setEditingCategory(null)
    setForm({ category_name: '', category_description: '' })
    setFormError('')
    setModalOpen(true)
  }

  function openEditModal(category) {
    setEditingCategory(category)
    setForm({
      category_name: category.category_name,
      category_description: category.category_description || '',
    })
    setFormError('')
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingCategory(null)
  }

  function handleSave() {
    if (!form.category_name.trim()) {
      setFormError('Category name is required.')
      return
    }
    setSaving(true)
    setFormError('')
    const body = JSON.stringify({
      category_name: form.category_name.trim(),
      category_description: form.category_description.trim(),
    })
    const url = editingCategory
      ? `${API_BASE_URL}/api/catalog/categories/${editingCategory.category_id}/`
      : `${API_BASE_URL}/api/catalog/categories/`
    const method = editingCategory ? 'PUT' : 'POST'
    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body,
    })
      .then((r) => r.json().then((data) => ({ ok: r.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          const msg = data.error || data.detail || Object.values(data).flat().join(', ') || 'Failed to save category'
          setFormError(msg)
          setSaving(false)
          return
        }
        if (editingCategory) {
          setCategories((prev) => prev.map((c) => (c.category_id === data.category_id ? data : c)))
        } else {
          setCategories((prev) => [data, ...prev])
        }
        closeModal()
        setSaving(false)
      })
      .catch(() => {
        setFormError('Network error. Please try again.')
        setSaving(false)
      })
  }

  function handleDelete(categoryId) {
    if (!confirm('Are you sure you want to delete this category?')) return
    fetch(`${API_BASE_URL}/api/catalog/categories/${categoryId}/`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to delete category')
        setCategories((prev) => prev.filter((c) => c.category_id !== categoryId))
      })
      .catch(() => alert('Failed to delete category'))
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
        <h1 className="text-2xl font-bold text-gray-900">Manage Categories</h1>
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors hover:opacity-90 active:scale-95"
          style={{ backgroundColor: '#1e3a5f' }}
        >
          <Plus size={18} />
          Add Category
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {categories.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No categories found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-3">Category Name</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map((category) => (
                  <tr key={category.category_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{category.category_name}</td>
                    <td className="px-6 py-4 text-gray-600">{category.category_description || '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(category)}
                          className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(category.category_id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                <input
                  type="text"
                  value={form.category_name}
                  onChange={(e) => setForm((f) => ({ ...f, category_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Outerwear"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.category_description}
                  onChange={(e) => setForm((f) => ({ ...f, category_description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Optional description"
                />
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
                {saving ? 'Saving…' : 'Save Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
