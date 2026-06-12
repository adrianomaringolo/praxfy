import Link from 'next/link'
import { redirect } from 'next/navigation'
import { addDays, format, subDays } from 'date-fns'
import {
  AlertCircle,
  Clock,
  FileText,
  FolderKanban,
  type LucideIcon,
} from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import {
  countActiveContracts,
  countOverdueOccurrences,
  countProjects,
  countUpcomingOccurrences,
  getStaleProjects,
  getUpcomingRecurrences,
} from '@/db/queries/dashboard'
import { formatDate, todayISO } from '@/lib/format'

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: number
  icon: LucideIcon
  color: string
}) {
  return (
    <div className="bg-surface-card rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
      <div className={`p-2.5 rounded-lg ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-xs font-medium tracking-wide uppercase text-text-muted">
          {label}
        </p>
        <p className="text-3xl font-display font-bold text-text-primary mt-1">
          {value}
        </p>
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')

  const today = todayISO()
  const in7Days = format(addDays(new Date(), 7), 'yyyy-MM-dd')
  const cutoff = subDays(new Date(), 15)

  const [
    projectCount,
    contractCount,
    overdueCount,
    upcomingCount,
    upcomingRecurrences,
    staleProjects,
  ] = await Promise.all([
    countProjects(user.id),
    countActiveContracts(user.id),
    countOverdueOccurrences(user.id, today),
    countUpcomingOccurrences(user.id, today, in7Days),
    getUpcomingRecurrences(user.id, 5),
    getStaleProjects(user.id, cutoff),
  ])

  return (
    <div className="flex flex-col gap-6 px-4 py-4 md:px-6 md:py-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-text-primary">
          Dashboard
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Visão geral dos seus projetos, contratos e recorrências.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          label="Projetos ativos"
          value={projectCount}
          icon={FolderKanban}
          color="bg-primary-600"
        />
        <StatCard
          label="Contratos ativos"
          value={contractCount}
          icon={FileText}
          color="bg-info"
        />
        <StatCard
          label="Recorrências vencidas"
          value={overdueCount}
          icon={AlertCircle}
          color="bg-danger"
        />
        <StatCard
          label="Vencendo em 7 dias"
          value={upcomingCount}
          icon={Clock}
          color="bg-warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <section className="bg-surface-card rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-display font-semibold text-text-primary px-5 py-4 border-b border-gray-100">
            Próximas recorrências
          </h2>
          {upcomingRecurrences.length === 0 ? (
            <p className="text-sm text-text-muted px-5 py-6">
              Nenhuma recorrência ativa.
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {upcomingRecurrences.map((recurrence) => (
                <Link
                  key={recurrence.id}
                  href={`/recurrences/${recurrence.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-surface-muted"
                >
                  <span className="text-sm font-medium text-text-primary">
                    {recurrence.name}
                  </span>
                  <span
                    className={`text-sm ${
                      recurrence.nextOccurrenceAt < today
                        ? 'text-danger font-semibold'
                        : 'text-text-secondary'
                    }`}
                  >
                    {formatDate(recurrence.nextOccurrenceAt)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="bg-surface-card rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-display font-semibold text-text-primary px-5 py-4 border-b border-gray-100">
            Projetos sem movimentação
          </h2>
          {staleProjects.length === 0 ? (
            <p className="text-sm text-text-muted px-5 py-6">
              Todos os projetos tiveram atualizações nos últimos 15 dias. 🎉
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {staleProjects.map(({ project, stageName, stageColor, lastLogAt }) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-surface-muted"
                >
                  <span className="flex flex-col">
                    <span className="text-sm font-medium text-text-primary">
                      {project.name}
                    </span>
                    <span className="text-xs text-text-muted">
                      {lastLogAt
                        ? `Último log em ${formatDate(lastLogAt)}`
                        : 'Nenhum log registrado'}
                    </span>
                  </span>
                  {stageName && (
                    <span
                      className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: stageColor ?? '#6366f1' }}
                    >
                      {stageName}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
