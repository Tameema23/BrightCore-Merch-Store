import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import CartDrawer from './CartDrawer'
import {
  ShoppingBag,
  Package,
  User,
  LayoutDashboard,
  Tags,
  LogOut,
  ShoppingCart,
} from 'lucide-react'

const navByRole = {
  employee: [
    { to: '/',       label: 'Shop',       icon: ShoppingBag },
    { to: '/orders', label: 'My Orders',  icon: Package },
    { to: '/account',label: 'My Account', icon: User },
  ],
  fulfillment_admin: [
    { to: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard },
  ],
  product_admin: [
    { to: '/admin/products',   label: 'Manage Products',    icon: ShoppingBag },
    { to: '/admin/categories', label: 'Manage Categories',  icon: Tags },
  ],
}

export default function Layout() {
  const { user, role, logout } = useAuth()
  const { totalItems } = useCart()
  const navigate = useNavigate()
  const [cartOpen, setCartOpen] = useState(false)

  const links = navByRole[role] || navByRole.employee

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className="fixed top-0 left-0 h-screen flex flex-col"
        style={{ width: 220, backgroundColor: '#1e3a5f' }}
      >
        <div className="px-5 py-6">
          <span className="text-white text-xl font-bold">BrightCore</span>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/' || to === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive ? 'text-white' : 'text-gray-300 hover:text-white'
                }`
              }
              style={({ isActive }) =>
                isActive ? { backgroundColor: '#2d4f7c' } : undefined
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Cart button - only for employees */}
        {role === 'employee' && (
          <div className="px-3 pb-2">
            <button
              onClick={() => setCartOpen(true)}
              className="flex items-center justify-between w-full px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white transition-colors"
              style={{ backgroundColor: totalItems > 0 ? '#2d4f7c' : undefined }}
            >
              <div className="flex items-center gap-3">
                <ShoppingCart size={18} />
                <span>Cart</span>
              </div>
              {totalItems > 0 && (
                <span className="bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        )}

        <div className="px-5 py-4 border-t border-white/10">
          <p className="text-white font-bold text-sm">{user?.name}</p>
          <p className="text-gray-400 text-xs mt-0.5">{user?.department}</p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 mt-3 text-gray-300 hover:text-white text-sm transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1" style={{ marginLeft: 220, backgroundColor: '#f9fafb', padding: 32 }}>
        <Outlet />
      </main>

      {/* Cart drawer */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  )
}