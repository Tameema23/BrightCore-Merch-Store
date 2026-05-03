import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Package, ChevronDown, ChevronUp } from 'lucide-react'

const API_BASE_URL = import.meta.env.VITE_API_URL

const STATUS_STYLES = {
  Pending:          { bg: 'bg-blue-100',   text: 'text-blue-700' },
  Processing:       { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  Ready_for_Pickup: { bg: 'bg-purple-100', text: 'text-purple-700' },
  Fulfilled:        { bg: 'bg-green-100',  text: 'text-green-700' },
  Cancelled:        { bg: 'bg-red-100',    text: 'text-red-700' },
}

export default function OrdersPage() {
  const { user, token } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedOrder, setExpandedOrder] = useState(null)

  useEffect(() => {
    if (!user?.employee_id) return
    fetch(`${API_BASE_URL}/api/orders/my-orders/${user.employee_id}/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to fetch orders')
        return r.json()
      })
      .then((data) => { setOrders(data); setLoading(false) })
      .catch((err) => { setError(err.message); setLoading(false) })
  }, [user, token])

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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm text-center py-16">
          <Package size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400 text-sm">You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const style = STATUS_STYLES[order.status] || STATUS_STYLES.Pending
            const isExpanded = expandedOrder === order.order_id
            return (
              <div key={order.order_id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpandedOrder(isExpanded ? null : order.order_id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-6">
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-900">Order #{order.order_id}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(order.order_date + 'T12:00:00').toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-gray-900">
                      ${parseFloat(order.total_amount).toFixed(2)}
                    </span>
                    {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                  </div>
                </button>

                {isExpanded && order.orderline_set && (
                  <div className="border-t border-gray-100 px-6 py-4">
                    <table className="w-full text-sm">
                      <thead className="text-gray-500 text-xs uppercase tracking-wider">
                        <tr>
                          <th className="text-left pb-2">Item</th>
                          <th className="text-left pb-2">Size / Color</th>
                          <th className="text-right pb-2">Qty</th>
                          <th className="text-right pb-2">Unit Price</th>
                          <th className="text-right pb-2">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {order.orderline_set.map((line) => (
                          <tr key={line.orderline_id}>
                            <td className="py-2 text-gray-900 font-medium">
                              {line.variant?.product?.product_name || `Variant #${line.variant?.variant_id || '?'}`}
                            </td>
                            <td className="py-2 text-gray-500">
                              {line.variant?.size?.size_code || '—'} / {line.variant?.color?.color_name || '—'}
                            </td>
                            <td className="py-2 text-right text-gray-600">{line.quantity}</td>
                            <td className="py-2 text-right text-gray-600">${parseFloat(line.unit_price).toFixed(2)}</td>
                            <td className="py-2 text-right font-medium text-gray-900">${parseFloat(line.line_total).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
