const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: 'Ativo', className: 'bg-success-light text-success' },
  paused: { label: 'Pausado', className: 'bg-warning-light text-warning' },
  cancelled: { label: 'Cancelado', className: 'bg-danger-light text-danger' },
  pending: { label: 'Pendente', className: 'bg-info-light text-info' },
  done: { label: 'Concluído', className: 'bg-success-light text-success' },
  skipped: { label: 'Pulada', className: 'bg-gray-100 text-text-muted' },
  overdue: { label: 'Vencida', className: 'bg-danger-light text-danger' },
}

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? {
    label: status,
    className: 'bg-gray-100 text-text-muted',
  }
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  )
}
