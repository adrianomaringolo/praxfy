export const PLANS = {
  FREE: {
    id: 'free',
    name: 'Gratuito',
    price: 0,
    limits: {
      clients: 3,
      projects: 5,
      contracts: 2,
      recurrences: 3,
    },
    features: [
      'Até 3 clientes',
      'Até 5 projetos',
      'Portal do cliente',
      'Recorrências básicas',
    ],
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    price: 4900, // centavos = R$49,00/mês
    limits: {
      clients: Infinity,
      projects: Infinity,
      contracts: Infinity,
      recurrences: Infinity,
    },
    features: [
      'Clientes ilimitados',
      'Projetos ilimitados',
      'Contratos ilimitados',
      'Recorrências ilimitadas',
      'Upload de documentos',
      'Exportação CSV',
      'Suporte prioritário',
    ],
  },
} as const

export type PlanId = keyof typeof PLANS
export type LimitedResource = keyof typeof PLANS.FREE.limits
