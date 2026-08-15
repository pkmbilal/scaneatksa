// Full restaurant-request history. Same data as the original page.js, restyled.

const statusTint = {
  pending: 'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400',
  approved: 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400',
  rejected: 'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400',
}

export default function AllRequestsTab({ allRequests }) {
  if (allRequests.length === 0) {
    return <div className="text-center py-12 text-gray-500 dark:text-gray-400">No requests yet.</div>
  }

  return (
    <div className="space-y-3">
      {allRequests.map((request) => (
        <div key={request.id} className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <h3 className="font-bold text-gray-800 dark:text-white/90">{request.restaurant_name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {request.user_profiles?.email} • {new Date(request.created_at).toLocaleDateString()}
              </p>
            </div>

            <span
              className={`text-xs px-3 py-1 rounded-full font-semibold whitespace-nowrap ${
                statusTint[request.status] || statusTint.pending
              }`}
            >
              {request.status}
            </span>
          </div>

          {request.status === 'rejected' && request.rejection_reason && (
            <p className="text-xs text-error-600 dark:text-error-400 mt-2">
              Reason: {request.rejection_reason}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
