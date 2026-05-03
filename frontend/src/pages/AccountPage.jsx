import { useAuth } from '../context/AuthContext'
import { Mail, Building, User } from 'lucide-react'

const roleLabels = {
  employee: 'Employee',
  fulfillment_admin: 'Fulfillment Admin',
  product_admin: 'Product Admin',
}

function getInitials(name) {
  if (!name) return ''
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

function AccountPage() {
  const { user, role } = useAuth()
  const label = roleLabels[role] || role

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Account</h1>

      <div className="bg-white rounded-lg shadow p-6" style={{ maxWidth: 600 }}>
        <div className="flex items-center gap-4 mb-6">
          <div
            className="flex items-center justify-center rounded-full text-white text-xl font-bold shrink-0"
            style={{ width: 64, height: 64, backgroundColor: '#1e3a5f' }}
          >
            {getInitials(user?.name)}
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{user?.name}</p>
            <span
              className="inline-block mt-1 px-2.5 py-0.5 text-xs font-medium text-white rounded-full"
              style={{ backgroundColor: '#2563eb' }}
            >
              {label}
            </span>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          <div className="flex items-center gap-3 py-4">
            <Mail size={18} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm text-gray-900">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 py-4">
            <Building size={18} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Department</p>
              <p className="text-sm text-gray-900">{user?.department}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 py-4">
            <User size={18} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Role</p>
              <p className="text-sm text-gray-900">{label}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountPage
