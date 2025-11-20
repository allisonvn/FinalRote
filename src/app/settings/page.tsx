"use client"

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import SettingsPanel from '@/components/settings/SettingsPanel'

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SettingsPanel />
      </div>
    </DashboardLayout>
  )
}


