'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import {
  Sidebar,
  SidebarBody,
  SidebarFooter,
  SidebarHeader,
  SidebarList,
  SidebarListItem,
  SidebarNav,
} from 'buildgrid-ui'
import {
  BookOpen,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Menu,
  RefreshCw,
  Settings,
  Users,
} from 'lucide-react'
import { useIsDesktop } from '@/hooks/use-is-desktop'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'Clientes', icon: Users },
  { href: '/projects', label: 'Projetos', icon: FolderKanban },
  { href: '/contracts', label: 'Contratos', icon: FileText },
  { href: '/recurrences', label: 'Recorrências', icon: RefreshCw },
  { href: '/catalog', label: 'Catálogo', icon: BookOpen },
  { href: '/settings', label: 'Configurações', icon: Settings },
]

function Logo() {
  return (
    <span className="text-xl font-display font-bold text-white tracking-tight">
      Prax<span className="text-accent">fy</span>
    </span>
  )
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter()
  const pathname = usePathname()

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`)

  return (
    <>
      <SidebarHeader className="px-4 py-5 border-b border-primary-800">
        <Logo />
      </SidebarHeader>
      <SidebarBody>
        <SidebarNav>
          <SidebarList className="flex flex-col gap-1 px-3 py-4">
            {navItems.map((item) => (
              <SidebarListItem
                key={item.href}
                onClick={() => {
                  router.push(item.href)
                  onNavigate?.()
                }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer
                  ${
                    isActive(item.href)
                      ? 'bg-sidebar-active text-white'
                      : 'text-sidebar-text hover:bg-sidebar-hover'
                  }`}
              >
                <item.icon size={18} />
                {item.label}
              </SidebarListItem>
            ))}
          </SidebarList>
        </SidebarNav>
      </SidebarBody>
      <SidebarFooter className="px-4 py-4 border-t border-primary-800">
        <div className="flex items-center gap-3">
          <UserButton />
          <span className="text-xs text-sidebar-muted">Minha conta</span>
        </div>
      </SidebarFooter>
    </>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const isDesktop = useIsDesktop()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-surface">
      {isDesktop ? (
        <Sidebar fixed className="bg-sidebar-bg">
          <SidebarContent />
        </Sidebar>
      ) : (
        <Sidebar
          fixed={false}
          isOpen={mobileOpen}
          onToggle={setMobileOpen}
          className="bg-sidebar-bg"
        >
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </Sidebar>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {!isDesktop && (
          <header className="flex items-center justify-between px-4 py-3 bg-sidebar-bg">
            <button
              type="button"
              aria-label="Abrir menu"
              onClick={() => setMobileOpen(true)}
              className="text-white p-1 rounded-lg hover:bg-sidebar-hover"
            >
              <Menu size={22} />
            </button>
            <Logo />
            <UserButton />
          </header>
        )}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
