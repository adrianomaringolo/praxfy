import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChevronRight, CreditCard, GitBranch } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'

export default async function SettingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  return (
    <div className="flex flex-col gap-6 px-4 py-4 md:px-6 md:py-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-text-primary">
          Configurações
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Perfil, pipelines e plano da sua conta.
        </p>
      </div>

      <div className="bg-surface-card rounded-xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-medium tracking-wide uppercase text-text-muted">
          Perfil
        </p>
        <p className="text-sm font-medium text-text-primary mt-2">
          {user.name}
        </p>
        <p className="text-sm text-text-secondary">{user.email}</p>
        <p className="text-xs text-text-muted mt-2">
          Para alterar nome, email ou senha, use o menu da sua conta na barra
          lateral.
        </p>
      </div>

      <div className="bg-surface-card rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-100">
        <Link
          href="/settings/pipelines"
          className="flex items-center gap-3 px-5 py-4 hover:bg-surface-muted"
        >
          <GitBranch size={18} className="text-primary-600" />
          <span className="flex-1">
            <span className="block text-sm font-medium text-text-primary">
              Pipelines
            </span>
            <span className="block text-xs text-text-secondary">
              Gerencie as etapas dos seus projetos
            </span>
          </span>
          <ChevronRight size={16} className="text-text-muted" />
        </Link>
        <Link
          href="/settings/billing"
          className="flex items-center gap-3 px-5 py-4 hover:bg-surface-muted"
        >
          <CreditCard size={18} className="text-primary-600" />
          <span className="flex-1">
            <span className="block text-sm font-medium text-text-primary">
              Plano
            </span>
            <span className="block text-xs text-text-secondary">
              Veja seu plano atual e faça upgrade
            </span>
          </span>
          <ChevronRight size={16} className="text-text-muted" />
        </Link>
      </div>
    </div>
  )
}
