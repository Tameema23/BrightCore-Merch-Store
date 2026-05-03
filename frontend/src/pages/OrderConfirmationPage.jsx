import { useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { CheckCircle2 } from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_URL

export default function OrderConfirmationPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { token } = useAuth()
  const orderId = searchParams.get('order_id')
  const paymentIntent = searchParams.get('payment_intent')
  const recorded = useRef(false)

  useEffect(() => {
    if (!orderId || !paymentIntent || recorded.current) return
    recorded.current = true

    fetch(`${API_BASE_URL}/api/orders/${orderId}/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((order) => {
        return fetch(`${API_BASE_URL}/api/payments/record/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            order_id: Number(orderId),
            payment_method: 'Credit Card',
            amount: order.total_amount,
            transaction_reference: paymentIntent,
          }),
        })
      })
      .catch(() => {
        // Payment may already be recorded (e.g. page refresh) — silently ignore
      })
  }, [orderId, paymentIntent, token])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-10 py-12 max-w-md w-full text-center">
        <div className="mx-auto w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-6">
          <CheckCircle2 size={56} className="text-green-600" strokeWidth={2} />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Order Placed Successfully!
        </h1>

        {orderId && (
          <p className="text-sm text-gray-500 mb-1">
            Order <span className="font-semibold text-gray-900">#{orderId}</span>
          </p>
        )}

        <p className="text-sm text-gray-600 mt-3 mb-8">
          Thank you for your order. We've received your payment and your order is
          now being processed. You'll receive a notification when it's ready for
          pickup.
        </p>

        <button
          onClick={() => navigate('/orders')}
          className="w-full py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#1e3a5f' }}
        >
          View My Orders
        </button>

        <button
          onClick={() => navigate('/')}
          className="mt-3 w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Continue shopping
        </button>
      </div>
    </div>
  )
}
