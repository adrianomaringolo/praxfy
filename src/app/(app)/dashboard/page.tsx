export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 px-6 py-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-text-primary">
          Dashboard
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Visão geral dos seus projetos, contratos e recorrências.
        </p>
      </div>
      <div className="bg-surface-card rounded-xl border border-gray-100 shadow-sm p-8 text-center">
        <p className="text-sm text-text-muted">
          Em breve: cards de resumo e listas de atenção (Fase 10).
        </p>
      </div>
    </div>
  )
}
