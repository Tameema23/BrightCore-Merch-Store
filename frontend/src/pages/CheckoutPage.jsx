import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { CreditCard, Loader2 } from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_URL

export default function CheckoutPage() {
  const [searchParams] = useSearchParams()
  const { token } = useAuth()
  const orderId = searchParams.get('order_id')

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (!orderId) {
      setLoadError('No order ID provided.')
      setLoading(false)
      return
    }

    fetch(`${API_BASE_URL}/api/orders/${orderId}/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load order')
        return r.json()
      })
      .then((data) => {
        setOrder(data)
        setLoading(false)
      })
      .catch((err) => {
        setLoadError(err.message)
        setLoading(false)
      })
  }, [orderId, token])

  async function handlePayWithCard() {
    if (!order) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await fetch(`${API_BASE_URL}/api/payments/create-checkout-session/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          order_id: Number(orderId),
          amount: order.total_amount,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || data.detail || 'Failed to create checkout session')
      }
      window.location.href = data.url
    } catch (err) {
      setSubmitError(err.message)
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center py-32">
        <p className="text-red-600 font-medium">{loadError}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment info */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Payment</h2>
            <div className="flex items-center gap-3 text-gray-500 text-sm">
              <CreditCard size={20} />
              <span>You will be redirected to Stripe's secure checkout to complete your payment.</span>
            </div>
          </div>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sticky top-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Order Summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Order ID</span>
                <span className="font-medium text-gray-900">#{order.order_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Items</span>
                <span className="font-medium text-gray-900">
                  {order.orderline_set?.length || 0}
                </span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-gray-900">
                  ${parseFloat(order.total_amount).toFixed(2)}
                </span>
              </div>
            </div>

            {submitError && (
              <p className="mt-4 text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">
                {submitError}
              </p>
            )}

            <button
              onClick={handlePayWithCard}
              disabled={submitting}
              className="mt-5 w-full py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
              style={{ backgroundColor: '#1e3a5f' }}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Redirecting...
                </>
              ) : (
                <>
                  <CreditCard size={16} />
                  Pay with Card · ${parseFloat(order.total_amount).toFixed(2)}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
