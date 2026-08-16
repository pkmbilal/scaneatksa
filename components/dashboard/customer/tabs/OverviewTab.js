'use client'

// Overview tab content for the customer dashboard's sidebar+tabs layout.
// Reuses ProfileCard.js and RequestOwnerCard.js unchanged.

import ProfileCard from '@/components/dashboard/customer/ProfileCard'
import RequestOwnerCard from '@/components/dashboard/customer/RequestOwnerCard'

export default function OverviewTab({ user, profile }) {
  return (
    <div className="space-y-5">
      <ProfileCard user={user} profile={profile} />
      <RequestOwnerCard />
    </div>
  )
}
