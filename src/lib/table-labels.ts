import type { DataTableLabels } from 'buildgrid-ui'

/** Labels PT-BR padrão para todas as DataTables (GUIDE seção 4) */
export const tableLabels: DataTableLabels = {
  searchPlaceholder: 'Buscar...',
  exportButton: 'Exportar CSV',
  clearAllButton: 'Limpar filtros',
  noDataAvailable: 'Nenhum registro encontrado.',
  noResultsWithFilters: 'Nenhum resultado para os filtros aplicados.',
  paginationCounter:
    'Exibindo {{startIndex}} a {{endIndex}} de {{totalItems}} registros',
  columnsButton: 'Colunas',
  rowSelectedSingular: 'linha selecionada',
  rowSelectedPlural: 'linhas selecionadas',
  clearSelectionButton: 'Limpar seleção',
  searchBadgePrefix: 'Busca',
  sortBadgePrefix: 'Ordenação',
  toggleColumnsMenuLabel: 'Exibir colunas',
  resetColumnsButton: 'Restaurar colunas',
  allFilterOption: (label) => `Todos (${label})`,
}
