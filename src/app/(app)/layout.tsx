import { AppShell } from '@/components/layout/app-shell'
import { syncUser } from '@/actions/users'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await syncUser()
  return <AppShell>{children}</AppShell>
}
