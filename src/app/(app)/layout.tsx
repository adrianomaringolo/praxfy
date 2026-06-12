import { AppShell } from '@/components/layout/app-shell'
import { UpgradeBanner } from '@/components/billing/upgrade-banner'
import { syncUser } from '@/actions/users'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await syncUser()
  return (
    <AppShell>
      <UpgradeBanner />
      {children}
    </AppShell>
  )
}
