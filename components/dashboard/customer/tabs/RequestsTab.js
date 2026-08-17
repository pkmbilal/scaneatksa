'use client'

// My Requests tab content for the customer dashboard's sidebar+tabs layout.
// Reuses RequestsCard.js unchanged.

import RequestsCard from '@/components/dashboard/customer/RequestsCard'

export default function RequestsTab({ requests }) {
  return <RequestsCard requests={requests} />
}
