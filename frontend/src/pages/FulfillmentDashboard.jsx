import { useState, useEffect } from 'react'
import { Package, Clock, Loader, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const API_BASE_URL = import.meta.env.VITE_API_URL

const STATUS_OPTIONS = ['Pending', 'Processing', 'Ready_for_Pickup', 'Fulfilled', 'Cancelled']
const FILTER_OPTIONS = ['All', ...STATUS_OPTIONS]
const PAYMENT_METHODS = ['Credit Card', 'Payroll Deduction']

const STATUS_STYLES = {
  Pending:          { bg: 'bg-blue-100',   text: 'text-blue-700' },
  Processing:       { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  Ready_for_Pickup: { bg: 'bg-purple-100', text: 'text-purple-700' },
  Fulfilled:        { bg: 'bg-green-100',  text: 'text-green-700' },
  Cancelled:        { bg: 'bg-red-100',    text: 'text-red-700' },
}

function StatCard({ label, count, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{count}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )
}

export default function FulfillmentDashboard() {
  const { token } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  // paymentForms: { [orderId]: { open, method, submitting, error } }
  const [paymentForms, setPaymentForms] = useState({})
  // paidOrders: Set of orderIds that were just paid in this session
  const [paidOrders, setPaidOrders] = useState(new Set())

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/orders/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to fetch orders')
        return r.json()
      })
      .then((data) => { setOrders(data); setLoading(false) })
      .catch((err) => { setError(err.message); setLoading(false) })
  }, [token])

  function handleStatusChange(orderId, newStatus) {
    fetch(`${API_BASE_URL}/api/orders/${orderId}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: newStatus }),
    })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to update status')
        return r.json()
      })
      .then((updated) => {
        setOrders((prev) =>
          prev.map((o) => (o.order_id === orderId ? { ...o, status: updated.status } : o))
        )
      })
      .catch(() => alert('Failed to update order status'))
  }

  function openPaymentForm(orderId) {
    setPaymentForms((prev) => ({
      ...prev,
      [orderId]: { open: true, method: PAYMENT_METHODS[0], submitting: false, error: '' },
    }))
  }

  function closePaymentForm(orderId) {
    setPaymentForms((prev) => {
      const next = { ...prev }
      delete next[orderId]
      return next
    })
  }

  function setPaymentMethod(orderId, method) {
    setPaymentForms((prev) => ({
      ...prev,
      [orderId]: { ...prev[orderId], method },
    }))
  }

  function handleRecordPayment(order) {
    const form = paymentForms[order.order_id]
    if (!form) return
    setPaymentForms((prev) => ({
      ...prev,
      [order.order_id]: { ...form, submitting: true, error: '' },
    }))
    fetch(`${API_BASE_URL}/api/payments/record/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        order_id: order.order_id,
        payment_method: form.method,
        amount: parseFloat(order.total_amount),
        transaction_reference: `TXN-${order.order_id}-${Date.now()}`,
      }),
    })
      .then((r) => r.json().then((data) => ({ ok: r.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          const msg = data.error || data.detail || Object.values(data).flat().join(', ') || 'Failed to record payment'
          setPaymentForms((prev) => ({
            ...prev,
            [order.order_id]: { ...form, submitting: false, error: msg },
          }))
          return
        }
        closePaymentForm(order.order_id)
        setPaidOrders((prev) => new Set([...prev, order.order_id]))
      })
      .catch(() => {
        setPaymentForms((prev) => ({
          ...prev,
          [order.order_id]: { ...form, submitting: false, error: 'Network error. Please try again.' },
        }))
      })
  }

  const filteredOrders = activeFilter === 'All'
    ? orders
    : orders.filter((o) => o.status === activeFilter)

  const totalOrders = orders.length
  const pending     = orders.filter((o) => o.status === 'Pending').length
  const processing  = orders.filter((o) => o.status === 'Processing').length
  const fulfilled   = orders.filter((o) => o.status === 'Fulfilled').length

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
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Fulfillment Dashboard</h1>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTER_OPTIONS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              activeFilter === f
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
            }`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Orders"  count={totalOrders} icon={Package}     color="bg-gray-700" />
        <StatCard label="Pending"       count={pending}     icon={Clock}       color="bg-blue-600" />
        <StatCard label="Processing"    count={processing}  icon={Loader}      color="bg-yellow-500" />
        <StatCard label="Fulfilled"     count={fulfilled}   icon={CheckCircle} color="bg-green-600" />
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">All Orders</h2>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-3">Order ID</th>
                  <th className="px-6 py-3">Employee</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Total</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Update Status</th>
                  <th className="px-6 py-3">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order) => {
                  const style = STATUS_STYLES[order.status] || STATUS_STYLES.Pending
                  const alreadyPaid = paidOrders.has(order.order_id) || order.payment != null
                  const form = paymentForms[order.order_id]
                  return (
                    <>
                      <tr key={order.order_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">#{order.order_id}</td>
                        <td className="px-6 py-4 text-gray-600">
                          {order.employee_name || `Employee #${order.employee}`}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {new Date(order.order_date + 'T12:00:00').toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">
                          ${parseFloat(order.total_amount).toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                            {order.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.order_id, e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>{s.replace('_', ' ')}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          {alreadyPaid ? (
                            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              Paid
                            </span>
                          ) : (
                            <button
                              onClick={() => form ? closePaymentForm(order.order_id) : openPaymentForm(order.order_id)}
                              className="px-3 py-1.5 rounded-md text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                            >
                              {form ? 'Cancel' : 'Record Payment'}
                            </button>
                          )}
                        </td>
                      </tr>

                      {form && (
                        <tr key={`${order.order_id}-payment`}>
                          <td colSpan={7} className="px-6 py-4 bg-blue-50 border-t border-blue-100">
                            <div className="flex flex-col gap-3">
                              <p className="text-sm font-medium text-gray-700">Payment method</p>
                              <div className="flex gap-2">
                                {PAYMENT_METHODS.map((m) => (
                                  <button
                                    key={m}
                                    onClick={() => setPaymentMethod(order.order_id, m)}
                                    className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                                      form.method === m
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                                    }`}
                                  >
                                    {m}
                                  </button>
                                ))}
                              </div>
                              {form.error && (
                                <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{form.error}</p>
                              )}
                              <div>
                                <button
                                  onClick={() => handleRecordPayment(order)}
                                  disabled={form.submitting}
                                  className="px-4 py-2 rounded-md text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                                >
                                  {form.submitting ? 'Saving…' : `Confirm Payment · $${parseFloat(order.total_amount).toFixed(2)}`}
                                </button>
                              </div>
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
    </div>
  )
}
