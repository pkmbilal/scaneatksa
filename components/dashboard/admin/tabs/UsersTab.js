// Users list with role/status management. Same handlers as the original page.js.

const roleTint = {
  admin: 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400',
  owner: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  customer: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

export default function UsersTab({ allUsers, currentUserId, onChangeRole, onToggleStatus, onDeleteUser }) {
  return (
    <div className="space-y-4">
      {allUsers.map((userItem) => {
        const isSelf = userItem.id === currentUserId
        return (
          <div
            key={userItem.id}
            className="rounded-2xl border border-gray-200 p-6 hover:border-gray-300 transition-colors dark:border-gray-800 dark:hover:border-gray-700"
          >
            <div className="flex items-start justify-between mb-4 gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-bold text-gray-800 dark:text-white/90 text-lg">
                    {userItem.full_name || 'No name'}
                  </h3>
                  {!userItem.is_active && (
                    <span className="text-xs bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400 px-2 py-1 rounded-full font-semibold">
                      DISABLED
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">ID: {userItem.id}</p>
                {userItem.phone && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Phone: {userItem.phone}</p>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  Created: {new Date(userItem.created_at).toLocaleDateString()}
                </p>
              </div>

              <span
                className={`text-xs px-3 py-1 rounded-full font-semibold whitespace-nowrap ${
                  roleTint[userItem.role] || roleTint.customer
                }`}
              >
                {userItem.role}
              </span>
            </div>

            <div className="flex gap-2 flex-wrap">
              <select
                value={userItem.role}
                onChange={(e) => onChangeRole(userItem.id, e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg text-sm font-semibold focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 focus:border-brand-300"
                disabled={isSelf}
              >
                <option value="customer">Customer</option>
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
              </select>

              <button
                onClick={() => onToggleStatus(userItem.id, userItem.is_active)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                  userItem.is_active
                    ? 'bg-warning-50 text-warning-700 hover:bg-warning-100 dark:bg-warning-500/15 dark:text-warning-400'
                    : 'bg-success-50 text-success-700 hover:bg-success-100 dark:bg-success-500/15 dark:text-success-400'
                }`}
                disabled={isSelf}
              >
                {userItem.is_active ? 'Disable User' : 'Enable User'}
              </button>

              <button
                onClick={() => onDeleteUser(userItem.id, userItem.full_name)}
                className="px-4 py-2 bg-error-50 text-error-700 rounded-lg font-semibold text-sm hover:bg-error-100 transition-colors dark:bg-error-500/15 dark:text-error-400"
                disabled={isSelf}
              >
                Delete User
              </button>
            </div>

            {isSelf && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 italic">
                You cannot modify your own account
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
