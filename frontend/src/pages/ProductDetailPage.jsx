import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ShoppingBag, ChevronRight } from 'lucide-react'
import { useCart } from '../context/CartContext'

const API_BASE_URL = import.meta.env.VITE_API_URL
const PLACEHOLDER = 'https://placehold.co/600x800?text=No+Image'

function resolveImageUrl(imagePath) {
  if (!imagePath) return PLACEHOLDER
  if (/^https?:\/\//i.test(imagePath)) return imagePath
  return `${API_BASE_URL}${imagePath.startsWith('/') ? imagePath : '/' + imagePath}`
}


function getStockStatus(qty) {
  if (qty <= 0) return { label: 'Out of Stock', bg: 'bg-red-100', text: 'text-red-600' }
  if (qty <= 5) return { label: 'Low Stock',    bg: 'bg-yellow-100', text: 'text-yellow-700' }
  return             { label: 'In Stock',       bg: 'bg-green-100', text: 'text-green-700' }
}

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedColorId, setSelectedColorId] = useState(null)
  const [selectedSizeId, setSelectedSizeId] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  useEffect(() => {
    setLoading(true)
    fetch(`${API_BASE_URL}/api/catalog/products/${id}/`)
      .then((r) => { if (!r.ok) throw new Error('Product not found'); return r.json() })
      .then((data) => {
        setProduct(data)
        const av = data.variants.filter((v) => v.stock_quantity > 0)
        if (av.length > 0) {
          setSelectedColorId(av[0].color.color_id)
          setSelectedSizeId(av[0].size.size_id)
        }
        setLoading(false)
      })
      .catch((err) => { setError(err.message); setLoading(false) })
  }, [id])

  const uniqueColors = product
    ? [...new Map(product.variants.map((v) => [v.color.color_id, v.color])).values()]
    : []
  const uniqueSizes = product
    ? [...new Map(product.variants.map((v) => [v.size.size_id, v.size])).values()]
    : []

  const selectedVariant = product?.variants.find(
    (v) => v.color.color_id === selectedColorId && v.size.size_id === selectedSizeId
  )

  const displayImages = product
    ? (product.images.filter((img) => img.color === null || img.color === selectedColorId).length > 0
        ? product.images.filter((img) => img.color === null || img.color === selectedColorId)
        : product.images)
    : []

  function handleColorSelect(colorId) {
    setSelectedColorId(colorId)
    setActiveImageIndex(0)
    const sizesForColor = product.variants
      .filter((v) => v.color.color_id === colorId && v.stock_quantity > 0)
      .map((v) => v.size.size_id)
    if (!sizesForColor.includes(selectedSizeId)) setSelectedSizeId(sizesForColor[0] ?? null)
  }

  function isSizeAvailable(sizeId) {
    if (!selectedColorId) return false
    const v = product.variants.find(
      (v) => v.color.color_id === selectedColorId && v.size.size_id === sizeId
    )
    return v ? v.stock_quantity > 0 : false
  }

  function handleAddToCart() {
    if (!selectedVariant || selectedVariant.stock_quantity <= 0) return
    const colorImg = product.images.find((img) => img.color === selectedColorId)
    const fallback = product.images[0]
    addItem({
      variant_id:   selectedVariant.variant_id,
      product_name: product.product_name,
      size_code:    selectedVariant.size.size_code,
      color_name:   selectedVariant.color.color_name,
      color_code:   selectedVariant.color.color_code,
      image_url:    resolveImageUrl(colorImg?.image_url ?? fallback?.image_url),
      price:        parseFloat(product.price),
      quantity,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error || !product) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
      <p className="text-red-600 font-medium">{error || 'Product not found'}</p>
      <button onClick={() => navigate('/')} className="text-sm text-blue-600 hover:underline">Back to catalog</button>
    </div>
  )

  const stockStatus = selectedVariant ? getStockStatus(selectedVariant.stock_quantity) : null
  const currentImageUrl = resolveImageUrl(displayImages[activeImageIndex]?.image_url)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-6 pt-6">
        <button onClick={() => navigate('/')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors">
          <ChevronLeft size={16} /> Back to catalog
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-2 gap-12">

        {/* Image Gallery */}
        <div className="flex flex-col gap-4">
          <div className="relative w-full aspect-[3/4] bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm group">
            <img
              key={currentImageUrl}
              src={currentImageUrl}
              alt={displayImages[activeImageIndex]?.alt_text || product.product_name}
              onError={(e) => { e.currentTarget.src = PLACEHOLDER }}
              className="w-full h-full object-cover transition-opacity duration-300"
            />

            {displayImages.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImageIndex((i) => i === 0 ? displayImages.length - 1 : i - 1)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow hover:bg-white transition opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft size={18} className="text-gray-700" />
                </button>
                <button
                  onClick={() => setActiveImageIndex((i) => i === displayImages.length - 1 ? 0 : i + 1)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow hover:bg-white transition opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight size={18} className="text-gray-700" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {displayImages.map((_, i) => (
                    <button key={i} onClick={() => setActiveImageIndex(i)}
                      className={`w-2 h-2 rounded-full transition-all ${i === activeImageIndex ? 'bg-white scale-125' : 'bg-white/50'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {displayImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {displayImages.map((img, i) => (
                <button key={img.image_id} onClick={() => setActiveImageIndex(i)}
                  className={`shrink-0 w-16 h-20 rounded-lg overflow-hidden border-2 transition-all ${i === activeImageIndex ? 'border-blue-600 shadow-sm' : 'border-transparent opacity-60 hover:opacity-90'}`}
                >
                  <img src={resolveImageUrl(img.image_url)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">{product.category.category_name}</p>
            <h1 className="text-3xl font-bold text-gray-900">{product.product_name}</h1>
            <p className="text-2xl font-bold text-blue-600 mt-2">${parseFloat(product.price).toFixed(2)}</p>
          </div>

          {product.description && (
            <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
          )}

          {/* Color selector */}
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-2">
              Color{' '}
              <span className="font-normal text-gray-500">
                {uniqueColors.find((c) => c.color_id === selectedColorId)?.color_name}
              </span>
            </p>
            <div className="flex gap-2 flex-wrap">
              {uniqueColors.map((color) => {
                const hasStock = product.variants.some(
                  (v) => v.color.color_id === color.color_id && v.stock_quantity > 0
                )
                return (
                  <button key={color.color_id} onClick={() => hasStock && handleColorSelect(color.color_id)}
                    title={color.color_name} disabled={!hasStock}
                    className={`relative w-9 h-9 rounded-full border-2 transition-all ${
                      selectedColorId === color.color_id ? 'border-blue-600 scale-110 shadow-md'
                      : hasStock ? 'border-gray-300 hover:border-gray-500'
                      : 'border-gray-200 opacity-30 cursor-not-allowed'
                    }`}
                    style={{ backgroundColor: color.color_code }}
                  />
                )
              })}
            </div>
          </div>

          {/* Size selector */}
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-2">Size</p>
            <div className="flex gap-2 flex-wrap">
              {uniqueSizes.map((size) => {
                const available = isSizeAvailable(size.size_id)
                const selected = selectedSizeId === size.size_id
                return (
                  <button key={size.size_id} onClick={() => available && setSelectedSizeId(size.size_id)}
                    disabled={!available}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                      selected ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                      : available ? 'border-gray-300 text-gray-700 hover:border-gray-500 bg-white'
                      : 'border-gray-200 text-gray-300 bg-gray-50 cursor-not-allowed line-through'
                    }`}
                  >
                    {size.size_code}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Stock badge */}
          {stockStatus && (
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${stockStatus.bg} ${stockStatus.text}`}>
                {stockStatus.label}
              </span>
              {selectedVariant?.stock_quantity > 0 && (
                <span className="text-xs text-gray-400">{selectedVariant.stock_quantity} left</span>
              )}
            </div>
          )}

          {/* Quantity */}
          {selectedVariant && selectedVariant.stock_quantity > 0 && (
            <div className="flex items-center gap-3">
              <p className="text-sm font-semibold text-gray-800">Quantity</p>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="px-3 py-2 text-gray-600 hover:bg-gray-100 transition-colors">−</button>
                <span className="px-4 py-2 text-sm font-medium border-x border-gray-300">{quantity}</span>
                <button onClick={() => setQuantity((q) => Math.min(selectedVariant.stock_quantity, q + 1))} className="px-3 py-2 text-gray-600 hover:bg-gray-100 transition-colors">+</button>
              </div>
            </div>
          )}

          {/* Add to cart */}
          <button onClick={handleAddToCart}
            disabled={!selectedVariant || selectedVariant.stock_quantity <= 0 || added}
            className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-semibold text-sm transition-all ${
              added ? 'bg-green-600 text-white'
              : !selectedVariant || selectedVariant.stock_quantity <= 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'text-white hover:opacity-90 active:scale-95'
            }`}
            style={!added && selectedVariant && selectedVariant.stock_quantity > 0 ? { backgroundColor: '#1e3a5f' } : {}}
          >
            <ShoppingBag size={18} />
            {added ? 'Added to Cart!' : !selectedVariant || selectedVariant.stock_quantity <= 0 ? 'Select a size' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  )
}