import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE_URL = import.meta.env.VITE_API_URL
const PLACEHOLDER_IMAGE = 'https://placehold.co/400x600?text=No+Image'

const SEEDED_CDN_IMAGE_MAP = {
  'tee-black.png':   '/media/products/tee-black.png',
  'tee-white.png':   '/media/products/tee-white.png',
  'hoodie-navy.png': '/media/products/hoodie-navy-front.png',
  'cap.png':         '/media/products/cap-black.png',
  'joggers-grey.png':'/media/products/joggers-grey.png',
}

function resolveImageUrl(imagePath) {
  if (!imagePath) return PLACEHOLDER_IMAGE
  if (/^https?:\/\//i.test(imagePath)) {
    try {
      const url = new URL(imagePath)
      const fileName = url.pathname.split('/').pop()
      if (url.hostname === 'cdn.brightcore.com' && SEEDED_CDN_IMAGE_MAP[fileName]) {
        return `${API_BASE_URL}${SEEDED_CDN_IMAGE_MAP[fileName]}`
      }
    } catch { return PLACEHOLDER_IMAGE }
    return imagePath
  }
  return `${API_BASE_URL}${imagePath.startsWith('/') ? imagePath : '/' + imagePath}`
}

function ProductCard({ product, onClick }) {
  const frontPath = product.images[0]?.image_url
  const backPath  = product.images[1]?.image_url
  const frontUrl  = resolveImageUrl(frontPath)
  const backUrl   = backPath ? resolveImageUrl(backPath) : null

  return (
    <div
      onClick={onClick}
      className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col h-full group cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="relative w-full aspect-[3/4] mb-4 overflow-hidden rounded-md">
        {backUrl && (
          <img
            src={backUrl}
            alt={`${product.product_name} back`}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <img
          src={frontUrl}
          alt={product.product_name}
          onError={(e) => { if (e.currentTarget.src !== PLACEHOLDER_IMAGE) e.currentTarget.src = PLACEHOLDER_IMAGE }}
          className={`relative w-full h-full object-cover transition-opacity duration-500 ease-in-out ${backUrl ? 'group-hover:opacity-0' : ''}`}
        />
      </div>
      <h3 className="text-sm font-semibold text-gray-800 leading-tight">{product.product_name}</h3>
      <p className="text-blue-600 font-bold mt-1 text-sm">${parseFloat(product.price).toFixed(2)}</p>
      <p className="text-xs text-gray-400 mt-1">{product.category.category_name}</p>
    </div>
  )
}

export default function CatalogPage() {
  const [products, setProducts]           = useState([])
  const [categories, setCategories]       = useState([])
  const [searchTerm, setSearchTerm]       = useState('')
  const [categorySelected, setCategorySelected] = useState('All')
  const [loading, setLoading]             = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE_URL}/api/catalog/products/`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/api/catalog/categories/`).then((r) => r.json()),
    ])
      .then(([prods, cats]) => {
        setProducts(prods)
        setCategories(cats)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = products.filter((p) => {
    const matchSearch = p.product_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchCat    = categorySelected === 'All' || p.category.category_name === categorySelected
    return matchSearch && matchCat
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold mb-6">Product Catalog</h1>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-8">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search products..."
          className="border border-gray-300 rounded-md px-4 py-2 w-full max-w-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={categorySelected}
          onChange={(e) => setCategorySelected(e.target.value)}
          className="border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="All">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.category_id} value={cat.category_name}>
              {cat.category_name}
            </option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-sm">No products found.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
          {filtered.map((product) => (
            <ProductCard
              key={product.product_id}
              product={product}
              onClick={() => navigate(`/products/${product.product_id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}